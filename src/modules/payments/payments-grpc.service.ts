import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, Observable, retry, timer } from 'rxjs';
import { Metadata, status as GrpcStatus } from '@grpc/grpc-js';
import { PAYMENTS_GRPC_SERVICE } from './payments.constants';

export interface AuthorizeRequest {
  orderId: string;
  amount: number;
  currency: string;
  idempotencyKey?: string;
}

export interface AuthorizeResponse {
  paymentId: string;
  status: string;
}

interface PaymentsGrpc {
  authorize(
    data: AuthorizeRequest,
    metadata: Metadata,
    options: { deadline: Date },
  ): Observable<AuthorizeResponse>;
  getPaymentStatus(
    data: { paymentId: string },
    metadata: Metadata,
  ): Observable<{ paymentId: string; status: string }>;
}

@Injectable()
export class PaymentsGrpcClientService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsGrpcClientService.name);
  private paymentsGrpc: PaymentsGrpc;
  private timeoutMs: number;

  constructor(
    @Inject(PAYMENTS_GRPC_SERVICE) private readonly client: ClientGrpc,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.paymentsGrpc = this.client.getService<PaymentsGrpc>('Payments');
    this.timeoutMs = Number(this.configService.get('PAYMENTS_GRPC_TIMEOUT_MS', 5000));
  }

  async authorize(request: AuthorizeRequest): Promise<AuthorizeResponse> {
    const deadline = new Date(Date.now() + this.timeoutMs);
    const metadata = new Metadata();

    try {
      return await lastValueFrom(
        this.paymentsGrpc.authorize(request, metadata, { deadline }).pipe(
          retry({
            count: 2,
            delay: (error, attempt) => {
              if (error?.code !== GrpcStatus.UNAVAILABLE) throw error;
              this.logger.warn({
                event: 'payments.authorize.retry',
                attempt,
                error: error.message,
              });
              return timer(attempt * 500);
            },
          }),
        ),
      );
    } catch (error) {
      throw this.mapGrpcError(error);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{ paymentId: string; status: string }> {
    try {
      return await lastValueFrom(
        this.paymentsGrpc.getPaymentStatus({ paymentId }, new Metadata()),
      );
    } catch (error) {
      throw this.mapGrpcError(error);
    }
  }

  private mapGrpcError(error: any): HttpException {
    const message: string = error?.message ?? 'Payment service error';
    switch (error?.code) {
      case GrpcStatus.NOT_FOUND:
        return new NotFoundException(message);
      case GrpcStatus.DEADLINE_EXCEEDED:
        return new GatewayTimeoutException('Payment service timed out');
      case GrpcStatus.UNAVAILABLE:
        return new ServiceUnavailableException('Payment service unavailable');
      default:
        return new BadGatewayException(`Payment service error: ${message}`);
    }
  }
}
