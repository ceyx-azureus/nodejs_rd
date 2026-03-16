import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @GrpcMethod('Payments', 'Authorize')
  authorize(data: { orderId: string; amount: number; currency: string; idempotencyKey?: string }) {
    return this.paymentsService.authorize(data.orderId, data.amount, data.currency, data.idempotencyKey);
  }

  @GrpcMethod('Payments', 'GetPaymentStatus')
  getPaymentStatus(data: { paymentId: string }) {
    return this.paymentsService.getStatus(data.paymentId);
  }

  @GrpcMethod('Payments', 'Capture')
  capture(data: { paymentId: string; idempotencyKey?: string }) {
    return this.paymentsService.capture(data.paymentId);
  }

  @GrpcMethod('Payments', 'Refund')
  refund(data: { paymentId: string; amount: number; idempotencyKey?: string }) {
    return this.paymentsService.refund(data.paymentId, data.amount);
  }
}
