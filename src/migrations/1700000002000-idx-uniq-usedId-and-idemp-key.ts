import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1700000002000 implements MigrationInterface {
  name = 'Migration1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "UQ_59d6b7756aeb6cbb43a093d15a1"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_orders_user_idempotency" ON "orders" ("user_id", "idempotency_key") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_orders_user_idempotency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "UQ_59d6b7756aeb6cbb43a093d15a1" UNIQUE ("idempotency_key")`,
    );
  }
}
