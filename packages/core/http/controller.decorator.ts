import "reflect-metadata";

export function Controller(baseRoute: string = ""): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata("controller:baseRoute", baseRoute, target);
  };
}
