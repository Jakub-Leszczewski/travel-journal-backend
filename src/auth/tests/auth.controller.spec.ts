import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';

const moduleMocker = new ModuleMocker(global);

const loginResult = 'login';
const logoutResult = 'logout';
const logoutAllResult = 'logoutAll';
const findOneResult = 'findOne';

const resMock: any = {};
const userMock: any = {};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    })
      .useMocker((token) => {
        if (token === AuthService) {
          return {
            login: jest.fn().mockResolvedValue(loginResult),
            logout: jest.fn().mockResolvedValue(logoutResult),
            logoutAll: jest.fn().mockResolvedValue(logoutAllResult),
          };
        }

        if (token === UserService) {
          return {
            findOne: jest.fn(() => findOneResult),
          };
        }

        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login - should calls to authService.login', async () => {
    const result = await controller.login(userMock, resMock);

    expect(result).toBe(loginResult);
  });

  it('logout - should calls to authService.logout', async () => {
    const result = await controller.logout(resMock);

    expect(result).toBe(logoutResult);
  });

  it('logoutAll - should calls to authService.logoutAll', async () => {
    const result = await controller.logoutAll(userMock, resMock);

    expect(result).toBe(logoutAllResult);
  });

  it('getAuthUser - should calls to userService.findOne', async () => {
    const result = await controller.getAuthUser(userMock);

    expect(result).toBe(findOneResult);
  });
});
