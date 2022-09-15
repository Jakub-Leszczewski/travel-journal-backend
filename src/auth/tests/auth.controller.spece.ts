import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { v4 as uuid } from 'uuid';

const moduleMocker = new ModuleMocker(global);

const loginResult = 'login';
const logoutResult = 'logout';
const logoutAllResult = 'logoutAll';
const findOneResult = 'findOne';

const userId = uuid();
const userMock: any = { id: userId };
const resMock: any = { res: true };

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    })
      .useMocker((token) => {
        if (token === AuthService) {
          return {
            login: jest.fn(async (user: any, res: any) => ({ user, res, result: loginResult })),
            logout: jest.fn(async (res: any) => ({ res, result: logoutResult })),
            logoutAll: jest.fn(async (user: any, res: any) => ({
              user,
              res,
              result: logoutAllResult,
            })),
          };
        }

        if (token === UserService) {
          return {
            findOne: jest.fn(async (userId) => ({ userId, result: findOneResult })),
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
    const result: any = await controller.login(userMock, resMock);

    expect(result.result).toBe(loginResult);
    expect(result.user).toEqual(userMock);
    expect(result.res).toEqual(resMock);
  });

  it('logout - should calls to authService.logout', async () => {
    const result: any = await controller.logout(resMock);

    expect(result.result).toBe(logoutResult);
    expect(result.res).toEqual(resMock);
  });

  it('logoutAll - should calls to authService.logoutAll', async () => {
    const result: any = await controller.logoutAll(userMock, resMock);

    expect(result.result).toBe(logoutAllResult);
    expect(result.user).toEqual(userMock);
    expect(result.res).toEqual(resMock);
  });

  it('getAuthUser - should calls to userService.findOne', async () => {
    const result: any = await controller.getAuthUser(userMock);

    expect(result.result).toBe(findOneResult);
    expect(result.userId).toBe(userId);
  });
});
