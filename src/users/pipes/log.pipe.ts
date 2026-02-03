import { PipeTransform } from "../../../packages/core/http";

export class LogPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === "object") {
      console.log("[LogPipe] value is object:", value);
    }
    return value;
  }
}
