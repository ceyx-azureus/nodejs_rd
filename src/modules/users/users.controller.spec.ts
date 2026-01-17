import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let usersController: UsersController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [],
    }).compile();

    usersController = app.get<UsersController>(UsersController);
  });

  describe('root', () => {
    it('should return "Users"', () => {
      expect(usersController.getUsers()).toBe('Users');
    });
  });
});
