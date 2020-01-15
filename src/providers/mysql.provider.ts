import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module';
import { User } from '../users/users.entity';
import { ConfigService } from '../config/config.service';

export const MySqlProvider = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    return {
      type: 'mysql',
      ...configService.mysqlConfig,
      entities: [User],
      synchronize: true,
    };
  },
  inject: [ConfigService],
});
