import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1700000001000 implements MigrationInterface {
  name = 'Migration1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "idx_orders_user_status_created" ON "orders" ("user_id", "status", "created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_orders_user_status_created"`,
    );
  }
}
