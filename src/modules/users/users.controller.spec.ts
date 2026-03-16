import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: { getAll: jest.fn() },
        },
      ],
    }).compile();

    usersController = app.get<UsersController>(UsersController);
    usersService = app.get(UsersService);
  });

  describe('root', () => {
    it('should return users from UsersService', async () => {
      const mockUsers: User[] = [{ id: '1', email: 'test@example.com' } as User];
      usersService.getAll.mockResolvedValue(mockUsers);

      await expect(usersController.getAll()).resolves.toEqual(mockUsers);
      expect(usersService.getAll).toHaveBeenCalled();
    });
  });
});
