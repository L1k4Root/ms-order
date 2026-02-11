import { Module } from '@nestjs/common';
import { envConfig, NATS_SERVICE } from 'src/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envConfig.NATS_SERVERS,
        },
      }
  ]),
  ],
  exports: [
    ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envConfig.NATS_SERVERS,
        },
      }
  ]),
  ],
})
export class NatsModule {}
