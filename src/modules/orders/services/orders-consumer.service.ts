import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as amqplib from 'amqplib';

const EXCHANGE = 'orders.exchange';
const ORDERS_QUEUE = 'orders.process';
const DLQ = 'orders.dlq';
const ROUTING_KEY_PROCESS = 'order.process';
const ROUTING_KEY_DLQ = 'order.dlq';
const HANDLER = 'orders-worker';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUniqueViolation(error: any): boolean {
  return error?.code && error.code === '23505';
}

interface OrderMessage {
  messageId: string;
  orderId: string;
  createdAt: string;
  attempt: number;
  correlationId: string;
  producer: string;
  eventName: string;
}

@Injectable()
export class OrdersConsumerService implements OnModuleInit {
  private readonly logger = new Logger(OrdersConsumerService.name);
  private channel: amqplib.Channel;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    const url = this.configService.getOrThrow<string>('RABBITMQ_URL');

    const connection = await amqplib.connect(url);
    this.channel = await connection.createChannel();

    // Manual topology
    await this.channel.assertExchange(EXCHANGE, 'direct', { durable: true });
    await this.channel.assertQueue(ORDERS_QUEUE, { durable: true });
    await this.channel.bindQueue(ORDERS_QUEUE, EXCHANGE, ROUTING_KEY_PROCESS);
    await this.channel.assertQueue(DLQ, { durable: true });
    await this.channel.bindQueue(DLQ, EXCHANGE, ROUTING_KEY_DLQ);

    this.channel.consume(
      ORDERS_QUEUE,
      (msg) => {
        if (!msg) return;
        void this.handleMessage(msg);
      },
      { noAck: false },
    );

    this.logger.log('OrdersConsumerService listening on orders.process');
  }

  private async handleMessage(msg: amqplib.ConsumeMessage): Promise<void> {
    const data: OrderMessage = JSON.parse(msg.content.toString());
    const { messageId, orderId, attempt } = data;

    const maxRetries = this.configService.get<number>('MAX_RETRY_ATTEMPTS', 3);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      try {
        await queryRunner.query(
          `INSERT INTO processed_messages (message_id, order_id, handler)
           VALUES ($1, $2, $3)`,
          [messageId, orderId, HANDLER],
        );
      } catch (insertErr) {
        if (isUniqueViolation(insertErr)) {
          await queryRunner.rollbackTransaction();
          this.channel.ack(msg);
          this.logger.log({
            messageId,
            orderId,
            attempt,
            result: 'duplicate, skipping',
          });
          return;
        }
        throw insertErr;
      }

      await sleep(200 + Math.random() * 300);

      await queryRunner.query(
        `UPDATE orders SET status = 'PROCESSED', processed_at = NOW()
         WHERE id = $1`,
        [orderId],
      );

      await queryRunner.commitTransaction();
      this.channel.ack(msg);

      this.logger.log({ messageId, orderId, attempt, result: 'success' });
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (attempt < maxRetries) {
        await sleep(attempt * 1000);

        const retryMessage: OrderMessage = { ...data, attempt: attempt + 1 };
        this.channel.publish(
          EXCHANGE,
          ROUTING_KEY_PROCESS,
          Buffer.from(JSON.stringify(retryMessage)),
          { contentType: 'application/json', persistent: true },
        );
        this.channel.ack(msg);

        this.logger.log({
          messageId,
          orderId,
          attempt: attempt + 1,
          result: 'retry',
          reason: (error as Error).message,
        });
      } else {
        const dlqMessage = {
          ...data,
          reason: (error as Error).message,
        };
        this.channel.publish(
          EXCHANGE,
          ROUTING_KEY_DLQ,
          Buffer.from(JSON.stringify(dlqMessage)),
          { contentType: 'application/json', persistent: true },
        );
        this.channel.ack(msg);

        this.logger.log({
          messageId,
          orderId,
          attempt,
          result: 'dlq',
          reason: (error as Error).message,
        });
      }
    } finally {
      await queryRunner.release();
    }
  }
}
