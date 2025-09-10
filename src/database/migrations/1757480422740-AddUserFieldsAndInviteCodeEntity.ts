import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserFieldsAndInviteCodeEntity1757480422740
  implements MigrationInterface
{
  name = 'AddUserFieldsAndInviteCodeEntity1757480422740';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "invite_code" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "usedAt" TIMESTAMP, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "created_by_id" integer, "used_by_id" integer, CONSTRAINT "UQ_d3b40184c2e31f1c26f9424ac18" UNIQUE ("code"), CONSTRAINT "PK_a8940979efb1a84ca3470a09c85" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d3b40184c2e31f1c26f9424ac1" ON "invite_code" ("code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c5f7cc8ea0e501bd5c2e048ff9" ON "invite_code" ("expiresAt") `,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "birthday" date`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "hometown" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "currentLocation" point`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "inviteCode" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "invitesRemaining" integer NOT NULL DEFAULT '3'`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_code" ADD CONSTRAINT "FK_3a7b3331ac59574a9f63596ff5f" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_code" ADD CONSTRAINT "FK_03abb664caee5b60e8e9c73e1f8" FOREIGN KEY ("used_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invite_code" DROP CONSTRAINT "FK_03abb664caee5b60e8e9c73e1f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_code" DROP CONSTRAINT "FK_3a7b3331ac59574a9f63596ff5f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "invitesRemaining"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "inviteCode"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "currentLocation"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hometown"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "birthday"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c5f7cc8ea0e501bd5c2e048ff9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d3b40184c2e31f1c26f9424ac1"`,
    );
    await queryRunner.query(`DROP TABLE "invite_code"`);
  }
}
