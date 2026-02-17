import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1700000003000 implements MigrationInterface {
  name = 'Migration1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password_hash" character varying(72)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'user'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
