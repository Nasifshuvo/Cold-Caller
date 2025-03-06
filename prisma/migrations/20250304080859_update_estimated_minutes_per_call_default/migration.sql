-- AlterTable
ALTER TABLE `Call` MODIFY `final_cost` DECIMAL(10, 4) NULL DEFAULT (cost * 2);

-- Update existing clients to have the default estimatedMinutesPerCall value
UPDATE `Client` SET `estimatedMinutesPerCall` = 3 WHERE `estimatedMinutesPerCall` IS NULL;

-- Safely rename minutes to balanceInSeconds in Client table
ALTER TABLE `Client` 
CHANGE COLUMN `minutes` `balanceInSeconds` DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Safely rename minutes to seconds in Transaction table
ALTER TABLE `Transaction` 
CHANGE COLUMN `minutes` `seconds` DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Safely rename minutes to seconds in Campaign table
ALTER TABLE `Campaign` 
CHANGE COLUMN `actualMinutes` `actualSeconds` DECIMAL(10, 2) NOT NULL DEFAULT 0,
CHANGE COLUMN `estimatedMinutes` `estimatedSeconds` DECIMAL(10, 2) NOT NULL DEFAULT 0;
