-- AlterTable
ALTER TABLE `Call` ADD COLUMN `durationInSeconds` INTEGER NULL,
    MODIFY `final_cost` DECIMAL(10, 4) NULL DEFAULT (cost * 2);
