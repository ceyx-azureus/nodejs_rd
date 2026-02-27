import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1700000004000 implements MigrationInterface {
  name = 'Migration1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."file_records_entity_type_enum" AS ENUM('user', 'product', 'receipt')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_records_status_enum" AS ENUM('pending', 'processing', 'ready', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_records_visibility_enum" AS ENUM('private', 'public', 'shared')`,
    );
    await queryRunner.query(
      `CREATE TABLE "file_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "owner_id" uuid NOT NULL,
        "entity_id" uuid NOT NULL,
        "entity_type" "public"."file_records_entity_type_enum" NOT NULL,
        "key" character varying NOT NULL,
        "original_name" character varying NOT NULL,
        "content_type" character varying NOT NULL,
        "size" bigint NOT NULL,
        "url" character varying,
        "status" "public"."file_records_status_enum" NOT NULL DEFAULT 'pending',
        "visibility" "public"."file_records_visibility_enum" NOT NULL DEFAULT 'private',
        "checksum" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_file_records" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_file_records_owner_id" ON "file_records" ("owner_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_file_records_entity" ON "file_records" ("entity_type", "entity_id")`,
    );

    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "avatar_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "image_file_id" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "image_file_id"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_id"`);
    await queryRunner.query(`DROP INDEX "idx_file_records_entity"`);
    await queryRunner.query(`DROP INDEX "idx_file_records_owner_id"`);
    await queryRunner.query(`DROP TABLE "file_records"`);
    await queryRunner.query(
      `DROP TYPE "public"."file_records_visibility_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_records_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."file_records_entity_type_enum"`,
    );
  }
}
