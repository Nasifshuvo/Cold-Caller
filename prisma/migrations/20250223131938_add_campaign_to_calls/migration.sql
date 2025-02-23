-- AlterTable
ALTER TABLE `Call` ADD COLUMN `campaignId` INTEGER NULL,
    MODIFY `final_cost` DECIMAL(10, 4) NULL DEFAULT (cost * 2);

-- AlterTable
ALTER TABLE `Lead` ADD COLUMN `campaignId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Campaign` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'Call',
    `status` VARCHAR(191) NOT NULL DEFAULT 'Draft',
    `clientId` INTEGER NOT NULL,
    `totalLeads` INTEGER NOT NULL DEFAULT 0,
    `processedLeads` INTEGER NOT NULL DEFAULT 0,
    `estimatedCost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `actualCost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Campaign_clientId_idx`(`clientId`),
    INDEX `Campaign_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Call_campaignId_idx` ON `Call`(`campaignId`);

-- CreateIndex
CREATE INDEX `Lead_campaignId_idx` ON `Lead`(`campaignId`);

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `Campaign`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Call` ADD CONSTRAINT `Call_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `Campaign`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Campaign` ADD CONSTRAINT `Campaign_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
