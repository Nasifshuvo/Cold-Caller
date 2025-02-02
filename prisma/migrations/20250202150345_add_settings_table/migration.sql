/*
  Warnings:

  - You are about to drop the column `vapiCallId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to alter the column `date` on the `Appointment` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.
  - You are about to drop the column `analysis` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `assistantId` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `cost` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `costBreakdown` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `costDeducted` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `customerNumber` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `endedAt` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `endedReason` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `final_cost` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `messages` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `recordingUrl` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `stereoRecordingUrl` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `transcript` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `vapiCallId` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `webCallUrl` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `processed` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `Transaction` table. All the data in the column will be lost.
  - Made the column `leadId` on table `Call` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Call` DROP FOREIGN KEY `Call_leadId_fkey`;

-- DropIndex
DROP INDEX `Call_vapiCallId_idx` ON `Call`;

-- DropIndex
DROP INDEX `Call_vapiCallId_key` ON `Call`;

-- DropIndex
DROP INDEX `Transaction_processed_idx` ON `Transaction`;

-- DropIndex
DROP INDEX `Transaction_type_idx` ON `Transaction`;

-- AlterTable
ALTER TABLE `Appointment` DROP COLUMN `vapiCallId`,
    ADD COLUMN `callId` VARCHAR(191) NULL,
    MODIFY `date` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Call` DROP COLUMN `analysis`,
    DROP COLUMN `assistantId`,
    DROP COLUMN `cost`,
    DROP COLUMN `costBreakdown`,
    DROP COLUMN `costDeducted`,
    DROP COLUMN `customerNumber`,
    DROP COLUMN `endedAt`,
    DROP COLUMN `endedReason`,
    DROP COLUMN `final_cost`,
    DROP COLUMN `messages`,
    DROP COLUMN `recordingUrl`,
    DROP COLUMN `startedAt`,
    DROP COLUMN `stereoRecordingUrl`,
    DROP COLUMN `summary`,
    DROP COLUMN `transcript`,
    DROP COLUMN `type`,
    DROP COLUMN `vapiCallId`,
    DROP COLUMN `webCallUrl`,
    MODIFY `leadId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Transaction` DROP COLUMN `processed`,
    DROP COLUMN `reason`,
    DROP COLUMN `reference`;

-- AddForeignKey
ALTER TABLE `Call` ADD CONSTRAINT `Call_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
