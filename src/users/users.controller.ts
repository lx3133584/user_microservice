import { Controller, UseGuards, UseFilters } from '@nestjs/common';
import { UsersService } from './users.service';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { User } from './users.entity';
import { AdminAllowedArgs } from '../decorators/admin-allowed-args';
import { CreateUserInput, UpdateUserInput } from './users.interface';
import { AuthGuard } from '@nestjs/passport';
import { ExceptionFilter } from '../filters/rpc-exception.filter';

@UseFilters(new ExceptionFilter())
@Controller()
export class UserController {
  constructor(private usersService: UsersService) { }

  @GrpcMethod('UserService')
  async find(): Promise<User[]> {
    return await this.usersService.getAllUsers();
  }

  @GrpcMethod('UserService')
  @UseGuards(AuthGuard('jwt'))
  async findOne({
    username,
    email,
    id,
  }: {
    username?: string;
    email?: string;
    id?: number;
  }) {
    let user: User | undefined;
    if (id) {
      user = await this.usersService.findOne(id);
    } else if (username) {
      user = await this.usersService.findOneByUsername(username);
    } else if (email) {
      user = await this.usersService.findOneByEmail(email);
    } else {
      // Is this the best exception for a graphQL error?
      throw new RpcException('A username or email or id must be included');
    }

    if (user) return user;
    throw new RpcException('The user does not exist');
  }

  // A NotFoundException is intentionally not sent so bots can't search for emails
  @GrpcMethod('UserService')
  async forgotPassword(email: string) {
    return await this.usersService.forgotPassword(email);
  }

  // What went wrong is intentionally not sent (wrong username or code or user not in reset status)
  @GrpcMethod('UserService')
  async resetPassword({
    code,
    password,
    id,
  }: {
    code: string;
    password: string;
    id: number;
  }): Promise<User> {
    const user = await this.usersService.resetPassword(
      id,
      code,
      password,
    );
    if (!user) throw new RpcException('The password was not reset');
    return user;
  }

  @GrpcMethod('UserService')
  async createUser(
    createUserInput: CreateUserInput,
  ): Promise<User> {
    let createdUser: User | undefined;
    createdUser = await this.usersService.findOneByUsername(createUserInput.username);
    if (createdUser) throw new RpcException('Username Duplicate');
    createdUser = await this.usersService.create(createUserInput);
    return createdUser;
  }

  @GrpcMethod('UserService')
  @AdminAllowedArgs(
    'username',
    'fieldsToUpdate.username',
    'fieldsToUpdate.email',
    'fieldsToUpdate.enabled',
  )
  @UseGuards(AuthGuard('jwt'))
  async updateUser(
    id: number,
    fieldsToUpdate: UpdateUserInput,
    request: any,
  ): Promise<User> {
    let user: User | undefined;
    if (!id && request.user) id = request.user.id;
    try {
      user = await this.usersService.update(id, fieldsToUpdate);
    } catch (error) {
      throw new RpcException(error.message);
    }
    if (!user) throw new RpcException('The user does not exist');
    return user;
  }

  @GrpcMethod('UserService')
  @UseGuards(AuthGuard('jwt'))
  async addAdminPermission(id: number): Promise<User> {
    const user = await this.usersService.addPermission('admin', id);
    if (!user) throw new RpcException('The user does not exist');
    return user;
  }

  @GrpcMethod('UserService')
  @UseGuards(AuthGuard('jwt'))
  async removeAdminPermission(
    id: number,
  ): Promise<User> {
    const user = await this.usersService.removePermission('admin', id);
    if (!user) throw new RpcException('The user does not exist');
    return user;
  }
}
