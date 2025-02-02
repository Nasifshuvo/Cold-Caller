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
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Setting_key_key` ON `Setting`(`key`);

-- CreateIndex
CREATE INDEX `Setting_key_idx` ON `Setting`(`key`);

-- CreateIndex
CREATE INDEX `Setting_category_idx` ON `Setting`(`category`);

-- Insert default setting
INSERT INTO `Setting` (`key`, `value`, `category`, `label`, `description`, `isSystem`, `createdAt`, `updatedAt`)
VALUES ('call_rate_multiplier', '{"multiplier": 1}', 'billing', 'Call Rate Multiplier', 'Percentage multiplier applied to base call rates', true, NOW(), NOW()); 