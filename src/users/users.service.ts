import { Injectable } from "../../packages/core/di";

@Injectable()
export class UsersService {
  findAll() {
    return [1, 2, 3, 4, 5];
  }

  getById(id: number) {
    return { id, user: `user-${id}` };
  }
}
