import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { PaymentsAppModule } from './app.module';

async function bootstrap() {
  const port = process.env.PAYMENTS_GRPC_PORT ?? '5000';
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentsAppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'payments',
        protoPath: join(process.cwd(), 'proto/payments.proto'),
        url: `0.0.0.0:${port}`,
        loader: { longs: Number },
      },
    },
  );
  await app.listen();
}
bootstrap();
