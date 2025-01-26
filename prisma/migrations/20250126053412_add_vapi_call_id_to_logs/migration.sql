/*
  Warnings:

  - You are about to drop the column `callId` on the `Log` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Log_callId_idx` ON `Log`;

-- AlterTable
ALTER TABLE `Log` DROP COLUMN `callId`,
    ADD COLUMN `vapiCallId` VARCHAR(255) NULL;

-- CreateIndex
CREATE INDEX `Log_vapiCallId_idx` ON `Log`(`vapiCallId`);
