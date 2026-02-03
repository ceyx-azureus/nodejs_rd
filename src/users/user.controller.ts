import { Controller, Get, Param, ParseIntPipe } from "../../packages/core/http";
import { inject } from "../../packages/core/di";
import { UsersService } from "./users.service";

@Controller("/users")
export class UserController {
  private usersService = inject(UsersService);

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  findById(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.getById(id);
  }
}
