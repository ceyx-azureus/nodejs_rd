import "reflect-metadata";
import { PipeTransform } from "./pipe-transform.interface";

type PipeClass = new () => PipeTransform;

export function UsePipes(...pipes: PipeClass[]): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflect.defineMetadata("method:pipes", pipes, target.constructor, propertyKey);
  };
}
