/*
  Warnings:

  - A unique constraint covering the columns `[vapiKey]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Client` ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `vapiEndpoint` VARCHAR(191) NULL,
    ADD COLUMN `vapiKey` VARCHAR(191) NULL,
    ADD COLUMN `vapiSecret` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Client_vapiKey_key` ON `Client`(`vapiKey`);

-- CreateIndex
CREATE INDEX `Client_vapiKey_idx` ON `Client`(`vapiKey`);
