import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelationships1757714090374 implements MigrationInterface {
  name = 'AddRelationships1757714090374';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_relationships_type_enum" AS ENUM('pending_first_second', 'pending_second_first', 'friends', 'block_first_second', 'block_second_first', 'block_both')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_relationships" ("id" SERIAL NOT NULL, "user_first_id" bigint NOT NULL, "user_second_id" bigint NOT NULL, "type" "public"."user_relationships_type_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_f3c84217e7e4ab6513d7dd700e" CHECK ("user_first_id" < "user_second_id"), CONSTRAINT "PK_e07449c0f8314bb7d304d7161ac" PRIMARY KEY ("id", "user_first_id", "user_second_id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_relationships"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_relationships_type_enum"`,
    );
  }
}
