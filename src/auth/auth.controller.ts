import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { UseGuards, Controller, UseFilters } from '@nestjs/common';
import { User } from '../users/users.entity';
import { LoginUserInput, LoginResult } from './auth.interface';
import { AuthGuard } from '@nestjs/passport';
import { ExceptionFilter } from '../filters/rpc-exception.filter';

@UseFilters(new ExceptionFilter())
@Controller('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @GrpcMethod('UserService')
  async login(user: LoginUserInput): Promise<LoginResult> {
    const result = await this.authService.validateUserByPassword(user);
    if (result) return result;
    throw new RpcException(
      '用户名或密码错误',
    );
  }

  // There is no username guard here because if the person has the token, they can be any user
  @GrpcMethod('UserService')
  @UseGuards(AuthGuard('jwt'))
  async refreshToken(request: any): Promise<string> {
    const user: User = request.user;
    if (!user)
      throw new RpcException(
        '用户不存在',
      );
    const result = await this.authService.createJwt(user);
    if (result) return result.token;
    throw new RpcException(
      '创建token失败',
    );
  }
}
