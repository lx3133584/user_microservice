import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { MySqlProvider } from './providers/mysql.provider';

@Module({
  imports: [
    MySqlProvider,
    UsersModule,
    AuthModule,
    ConfigModule,
  ],
})
export class AppModule {}
