import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { PAYMENTS_GRPC_SERVICE } from './payments.constants';
import { PaymentsGrpcClientService } from './payments-grpc.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: PAYMENTS_GRPC_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'payments',
            protoPath: join(process.cwd(), 'proto/payments.proto'),
            url: configService.getOrThrow<string>('PAYMENTS_GRPC_URL'),
            loader: { longs: Number },
          },
        }),
      },
    ]),
  ],
  providers: [PaymentsGrpcClientService],
  exports: [PaymentsGrpcClientService],
})
export class PaymentsGrpcModule {}
