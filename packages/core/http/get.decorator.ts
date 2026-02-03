import "reflect-metadata";

export function Get(path: string = ""): MethodDecorator {
  return (target: any, handlerName: string | symbol) => {
    if (!Reflect.hasMetadata("routes", target.constructor)) {
      Reflect.defineMetadata("routes", [], target.constructor);
    }

    const routes = Reflect.getMetadata("routes", target.constructor);
    routes.push({
      method: "get",
      path,
      handlerName,
    });

    Reflect.defineMetadata("routes", routes, target.constructor);
  };
}
