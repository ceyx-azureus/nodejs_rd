import { PipeTransform } from "./pipe-transform.interface";
import { HttpException } from "../exceptions";

export class ParseIntPipe implements PipeTransform {
  transform(value: any) {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new HttpException(400, "Validation failed: not a number");
    }
    return parsed;
  }
}
