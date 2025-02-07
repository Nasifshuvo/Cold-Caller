-- Add new fields to Transaction
ALTER TABLE `Transaction` 
ADD COLUMN `reason` VARCHAR(191) NOT NULL,
ADD COLUMN `reference` VARCHAR(191),
ADD COLUMN `processed` BOOLEAN NOT NULL DEFAULT false;

-- Add new field to Call
ALTER TABLE `Call` 
ADD COLUMN `costDeducted` BOOLEAN NOT NULL DEFAULT false;

-- Add new indexes
CREATE INDEX `Transaction_processed_idx` ON `Transaction`(`processed`);
CREATE INDEX `Transaction_type_idx` ON `Transaction`(`type`); 