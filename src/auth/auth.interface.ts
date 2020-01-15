import { User } from '../users/users.entity';

export interface LoginUserInput {
  username?: string;
  email?: string;
  password: string;
}

export interface LoginResult {
  user: User;
  token: string;
}
