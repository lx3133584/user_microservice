import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { join } from 'path';

const grpcClientOptions = {
  transport: Transport.GRPC,
  options: {
    url: '127.0.0.1:5500',
    package: 'user',
    protoPath: join(__dirname, 'app.proto'),
  },
};

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, grpcClientOptions);
  await app.listenAsync();
}
bootstrap();
