/*
  Warnings:

  - A unique constraint covering the columns `[vapiCallId]` on the table `Call` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Call` DROP FOREIGN KEY `Call_leadId_fkey`;

-- AlterTable
ALTER TABLE `Call` ADD COLUMN `analysis` JSON NULL,
    ADD COLUMN `assistantId` VARCHAR(191) NULL,
    ADD COLUMN `cost` DECIMAL(10, 4) NULL,
    ADD COLUMN `costBreakdown` JSON NULL,
    ADD COLUMN `costDeducted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `customerNumber` VARCHAR(191) NULL,
    ADD COLUMN `endedAt` DATETIME(3) NULL,
    ADD COLUMN `endedReason` VARCHAR(191) NULL,
    ADD COLUMN `final_cost` DECIMAL(10, 4) NULL,
    ADD COLUMN `messages` JSON NULL,
    ADD COLUMN `recordingUrl` TEXT NULL,
    ADD COLUMN `startedAt` DATETIME(3) NULL,
    ADD COLUMN `stereoRecordingUrl` TEXT NULL,
    ADD COLUMN `summary` TEXT NULL,
    ADD COLUMN `transcript` TEXT NULL,
    ADD COLUMN `type` VARCHAR(191) NULL,
    ADD COLUMN `vapiCallId` VARCHAR(191) NULL,
    ADD COLUMN `webCallUrl` TEXT NULL,
    MODIFY `leadId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `processed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `reason` VARCHAR(191) NOT NULL DEFAULT 'Legacy Transaction',
    ADD COLUMN `reference` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Call_vapiCallId_key` ON `Call`(`vapiCallId`);

-- CreateIndex
CREATE INDEX `Call_vapiCallId_idx` ON `Call`(`vapiCallId`);

-- CreateIndex
CREATE INDEX `Transaction_processed_idx` ON `Transaction`(`processed`);

-- CreateIndex
CREATE INDEX `Transaction_type_idx` ON `Transaction`(`type`);

-- AddForeignKey
ALTER TABLE `Call` ADD CONSTRAINT `Call_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
