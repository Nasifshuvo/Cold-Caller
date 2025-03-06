-- AlterTable
ALTER TABLE `Call` MODIFY `final_cost` DECIMAL(10, 4) NULL DEFAULT (cost * 2);
