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
    it('should return users from jsonplaceholder', async () => {
      const mockUsers = [{ id: 1, name: 'Leanne Graham' }];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUsers,
      } as any);

      await expect(usersController.getUsers()).resolves.toEqual(mockUsers);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://jsonplaceholder.typicode.com/users',
      );
    });
  });
});
