import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [{ name: 'orders.exchange', type: 'direct' }],
        uri: configService.getOrThrow<string>('RABBITMQ_URL'),
        connectionInitOptions: { wait: true },
      }),
    }),
  ],
  exports: [RabbitMQModule],
})
export class RabbitmqModule {}
