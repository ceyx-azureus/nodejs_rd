import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1700000005000 implements MigrationInterface {
  name = 'Migration1700000005000';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."orders_status_enum" ADD VALUE IF NOT EXISTS 'PROCESSED'`,
    );

    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "processed_at" TIMESTAMP`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "processed_messages" (
        "message_id" UUID PRIMARY KEY,
        "order_id"   UUID NOT NULL,
        "processed_at" TIMESTAMP DEFAULT NOW(),
        "handler"    VARCHAR(100)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "processed_messages"`);
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "processed_at"`,
    );
  }
}
