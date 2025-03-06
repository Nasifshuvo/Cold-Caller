-- AlterTable
ALTER TABLE `Call` MODIFY `final_cost` DECIMAL(10, 4) NULL DEFAULT (cost * 2);

-- AlterTable
ALTER TABLE `Transaction` ALTER COLUMN `minutes` DROP DEFAULT,
    ALTER COLUMN `updatedAt` DROP DEFAULT;
