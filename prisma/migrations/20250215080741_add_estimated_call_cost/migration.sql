-- AlterTable
ALTER TABLE `Call` MODIFY `final_cost` DECIMAL(10, 4) NULL DEFAULT (cost * 2);

-- AlterTable
ALTER TABLE `Client` ADD COLUMN `estimatedCallCost` DECIMAL(10, 2) NULL DEFAULT 0.00;
