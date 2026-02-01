import "reflect-metadata";

export type ModuleMetadata = {
  providers?: any[];
  controllers?: any[];
};

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(
      "module:providers",
      metadata.providers || [],
      target,
    );
    Reflect.defineMetadata(
      "module:controllers",
      metadata.controllers || [],
      target,
    );
  };
}
