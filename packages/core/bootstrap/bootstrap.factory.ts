import "reflect-metadata";

import { Container } from "../di/di-container";
import { PipeTransform } from "../pipes/pipe-transform.interface";

import express from "express";

export async function bootstrap(rootModule: any) {
  const app = express();
  const container = new Container();

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
          const methodPipes =
            Reflect.getMetadata(
              "method:pipes",
              ControllerClass,
              route.handlerName,
            ) || [];

          if (methodPipes.length) {
            req.params = runPipes(methodPipes, req.params);
          }

          const result = await controllerInstance[route.handlerName](req, res);
          console.log("result", result);
          res.send(result);
        },
      );
    });
  });

  app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
  });

  // app.get("/users", (req, res) => {
  //   res.send("GET request to the users");
  // });
}
