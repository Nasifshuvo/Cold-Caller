/*
  Warnings:

  - You are about to drop the column `actualCost` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedCost` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `balance` on the `Client` table. All the data in the column will be lost.
  - You are about to alter the column `estimatedCallCost` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Int`.
  - You are about to drop the column `amount` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `minutes` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Client_email_key` ON `Client`;

-- DropIndex
DROP INDEX `Transaction_processed_idx` ON `Transaction`;

-- DropIndex
DROP INDEX `Transaction_type_idx` ON `Transaction`;

-- AlterTable
ALTER TABLE `Call` MODIFY `final_cost` DECIMAL(10, 4) NULL DEFAULT (cost * 2);

-- Convert existing cost data to minutes in Campaign table
ALTER TABLE `Campaign` 
ADD COLUMN `actualMinutes` DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN `estimatedMinutes` DECIMAL(10, 2) NOT NULL DEFAULT 0;

UPDATE `Campaign` 
SET `estimatedMinutes` = COALESCE(`estimatedCost`, 0) * 2,
    `actualMinutes` = COALESCE(`actualCost`, 0) * 2;

ALTER TABLE `Campaign` 
DROP COLUMN `actualCost`,
DROP COLUMN `estimatedCost`;

-- Convert existing balance to minutes in Client table
ALTER TABLE `Client` 
ADD COLUMN `minutes` DECIMAL(10, 2) NOT NULL DEFAULT 0;

UPDATE `Client` 
SET `minutes` = COALESCE(`balance`, 0) * 2
WHERE `balance` IS NOT NULL;

ALTER TABLE `Client`
DROP COLUMN `balance`,
MODIFY `estimatedCallCost` INTEGER NULL;

-- Convert existing amount to minutes in Transaction table and handle updatedAt
ALTER TABLE `Transaction` 
ADD COLUMN `minutes` DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT NOW(3);

UPDATE `Transaction` 
SET `minutes` = COALESCE(`amount`, 0) * 2
WHERE `amount` IS NOT NULL;

ALTER TABLE `Transaction`
DROP COLUMN `amount`,
MODIFY `reason` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Client_vapiKey_idx` ON `Client`(`vapiKey`);
