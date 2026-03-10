import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('processed_messages')
export class ProcessedMessage {
  @PrimaryColumn({ name: 'message_id', type: 'uuid' })
  messageId: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @CreateDateColumn({ name: 'processed_at' })
  processedAt: Date;

  @Column({ name: 'handler', type: 'varchar', length: 100, nullable: true })
  handler: string | null;
}
