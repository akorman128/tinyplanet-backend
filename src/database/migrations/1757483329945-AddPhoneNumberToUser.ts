import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneNumberToUser1757483329945 implements MigrationInterface {
  name = 'AddPhoneNumberToUser1757483329945';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "phoneNumber" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phoneNumber"`);
  }
}
