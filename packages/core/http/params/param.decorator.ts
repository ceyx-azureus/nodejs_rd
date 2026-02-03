import "reflect-metadata";
import { PipeTransform } from "../../pipes/pipe-transform.interface";

type PipeClass = new () => PipeTransform;

export function Param(name: string, pipe?: PipeClass): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const existingParams = Reflect.getMetadata("method:params", target.constructor, propertyKey!) || [];
    existingParams.push({
      index: parameterIndex,
      name,
      pipe,
    });
    Reflect.defineMetadata("method:params", existingParams, target.constructor, propertyKey!);
  };
}
