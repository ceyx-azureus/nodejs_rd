import "reflect-metadata";

import { Container, setGlobalContainer } from "../di/di-container";
import { PipeTransform } from "../pipes/pipe-transform.interface";
import { HttpException, NotFoundException } from "../exceptions";

import express from "express";

export async function bootstrap(rootModule: any) {
  const app = express();
  const container = new Container();
  setGlobalContainer(container);

  const buildFullPath = (baseRoute: string, path: string) => {
    const normalized = [baseRoute, path]
      .map((segment) => String(segment || "").trim())
      .map((segment) => segment.replace(/^\/+|\/+$/g, ""))
      .filter(Boolean)
      .join("/");

    return `/${normalized}`.replace(/\/+$/g, "") || "/";
  };

  const runPipes = (pipes: (new () => PipeTransform)[], value: any) => {
    return pipes.reduce((acc, PipeClass) => {
      const pipeInstance = new PipeClass();
      return pipeInstance.transform(acc);
    }, value);
  };

  const handleError = (error: unknown, res: express.Response) => {
    if (error instanceof HttpException) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  };

  const providers = Reflect.getMetadata("module:providers", rootModule) || [];
  providers.forEach((provider: any) => container.resolve(provider));

  const controllers =
    Reflect.getMetadata("module:controllers", rootModule) || [];

  controllers.forEach((ControllerClass: any) => {
    const controllerInstance = container.resolve(ControllerClass);

    const baseRoute =
      Reflect.getMetadata("controller:baseRoute", ControllerClass) || "";

    const routes = Reflect.getMetadata("routes", ControllerClass) || [];

    routes.forEach((route: any) => {
      const fullPath = buildFullPath(baseRoute, route.path);

      app[route.method](
        fullPath,
        async (req: express.Request, res: express.Response) => {
          try {
            const methodPipes =
              Reflect.getMetadata(
                "method:pipes",
                ControllerClass,
                route.handlerName,
              ) || [];

            if (methodPipes.length) {
              req.params = runPipes(methodPipes, req.params);
            }

            const paramsMeta =
              Reflect.getMetadata(
                "method:params",
                ControllerClass,
                route.handlerName,
              ) || [];

            let args: any[] = [req, res];

            if (paramsMeta.length) {
              args = paramsMeta
                .sort((a: any, b: any) => a.index - b.index)
                .map((param: any) => {
                  let value = req.params[param.name];
                  if (param.pipe) {
                    const pipeInstance = new param.pipe();
                    value = pipeInstance.transform(value);
                  }
                  return value;
                });
            }

            const result = await controllerInstance[route.handlerName](...args);

            res.send(result);
          } catch (error) {
            handleError(error, res);
          }
        },
      );
    });
  });

  app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
  });

  app.use((req: express.Request, res: express.Response) => {
    handleError(new NotFoundException(), res);
  });
}
