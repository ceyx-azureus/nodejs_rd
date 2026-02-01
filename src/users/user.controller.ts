import { Controller, Get, UsePipes } from "../../packages/core/http";
import { LogPipe } from "./pipes/log.pipe";

@Controller("/users")
export class UserController {
  @Get()
  findAll() {
    return "All users";
  }

  @UsePipes(LogPipe)
  @Get(":id")
  findById(req: any) {
    console.log("id", req.params.id);
    return `Find user with id: ${req.params.id}`;
  }
}
