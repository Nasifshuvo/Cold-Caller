/*
  Warnings:

  - You are about to drop the column `callId` on the `Appointment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vapiCallId]` on the table `Call` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reason` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Call` DROP FOREIGN KEY `Call_leadId_fkey`;

-- AlterTable
ALTER TABLE `Appointment` DROP COLUMN `callId`,
    ADD COLUMN `vapiCallId` VARCHAR(191) NULL,
    MODIFY `date` VARCHAR(191) NOT NULL;

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
    ADD COLUMN `reason` VARCHAR(191) NOT NULL,
    ADD COLUMN `reference` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Setting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Setting_key_key`(`key`),
    INDEX `Setting_key_idx`(`key`),
    INDEX `Setting_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
