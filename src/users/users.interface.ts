export interface CreateUserInput {
  username: string;
  email?: string;
  password: string;
}

export interface UpdatePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  password?: UpdatePasswordInput;
  enabled?: boolean;
  lastLoginTime?: Date;
}
