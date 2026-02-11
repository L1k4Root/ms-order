import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envConfig } from './config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import 'dotenv/config';

async function bootstrap() {
  const logger = new Logger('OrderMicroservice');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule,{
    transport: Transport.NATS, // NATS transport
    options: {
      servers: envConfig.NATS_SERVERS,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));



  await app.listen();
  logger.log(`Starting OrderMicroservice on port: ${envConfig.PORT || 3000}`);
}
bootstrap();
