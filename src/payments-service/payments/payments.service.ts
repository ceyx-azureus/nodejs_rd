import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { randomUUID } from 'crypto';

interface PaymentRecord {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
}

@Injectable()
export class PaymentsService {
  private readonly payments = new Map<string, PaymentRecord>();
  private readonly idempotencyIndex = new Map<string, string>();

  authorize(orderId: string, amount: number, currency: string, idempotencyKey?: string) {
    if (idempotencyKey && this.idempotencyIndex.has(idempotencyKey)) {
      const paymentId = this.idempotencyIndex.get(idempotencyKey)!;
      const payment = this.payments.get(paymentId)!;
      return { paymentId: payment.paymentId, status: payment.status };
    }

    const paymentId = randomUUID();
    const record: PaymentRecord = { paymentId, orderId, amount, currency, status: 'AUTHORIZED' };
    this.payments.set(paymentId, record);
    if (idempotencyKey) {
      this.idempotencyIndex.set(idempotencyKey, paymentId);
    }
    return { paymentId, status: record.status };
  }

  getStatus(paymentId: string) {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Payment ${paymentId} not found` });
    }
    return { paymentId: payment.paymentId, status: payment.status };
  }

  capture(paymentId: string) {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Payment ${paymentId} not found` });
    }
    payment.status = 'CAPTURED';
    return { paymentId, status: payment.status };
  }

  refund(paymentId: string, amount: number) {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Payment ${paymentId} not found` });
    }
    payment.status = 'REFUNDED';
    return { paymentId, status: payment.status };
  }
}
