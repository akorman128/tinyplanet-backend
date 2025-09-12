import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateInviteCodeEntity1757710278868 implements MigrationInterface {
  name = 'UpdateInviteCodeEntity1757710278868';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invite_code" DROP CONSTRAINT "FK_3a7b3331ac59574a9f63596ff5f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_code" DROP CONSTRAINT "FK_03abb664caee5b60e8e9c73e1f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_code" ALTER COLUMN "created_by_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3a7b3331ac59574a9f63596ff5" ON "invite_code" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_03abb664caee5b60e8e9c73e1f" ON "invite_code" ("used_by_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_03abb664caee5b60e8e9c73e1f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3a7b3331ac59574a9f63596ff5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_code" ALTER COLUMN "created_by_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_code" ADD CONSTRAINT "FK_03abb664caee5b60e8e9c73e1f8" FOREIGN KEY ("used_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_code" ADD CONSTRAINT "FK_3a7b3331ac59574a9f63596ff5f" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
