-- AlterTable
ALTER TABLE `Log` ADD COLUMN `callId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Log_callId_idx` ON `Log`(`callId`);
