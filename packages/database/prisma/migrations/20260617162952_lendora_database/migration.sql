-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerifiedAt` DATETIME(3) NULL,
    `phone` VARCHAR(191) NULL,
    `phoneVerifiedAt` DATETIME(3) NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `address` VARCHAR(300) NULL,
    `avatarUrl` VARCHAR(500) NULL,
    `nidNumber` VARCHAR(30) NULL,
    `nidFrontImageUrl` VARCHAR(500) NULL,
    `nidBackImageUrl` VARCHAR(500) NULL,
    `bkashNumber` VARCHAR(15) NULL,
    `role` ENUM('CUSTOMER', 'VENDOR', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `status` ENUM('ACTIVE', 'INACTIVE', 'EMAIL_UNVERIFIED', 'PHONE_UNVERIFIED', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION') NOT NULL DEFAULT 'EMAIL_UNVERIFIED',
    `refreshTokenHash` VARCHAR(191) NULL,
    `resetToken` VARCHAR(191) NULL,
    `resetTokenExpiry` DATETIME(3) NULL,
    `emailVerifyToken` VARCHAR(191) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    UNIQUE INDEX `users_resetToken_key`(`resetToken`),
    UNIQUE INDEX `users_emailVerifyToken_key`(`emailVerifyToken`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_phone_idx`(`phone`),
    INDEX `users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `businessName` VARCHAR(120) NOT NULL,
    `businessDescription` TEXT NULL,
    `businessAddress` VARCHAR(300) NULL,
    `district` VARCHAR(60) NOT NULL,
    `division` VARCHAR(60) NOT NULL,
    `bankAccountName` VARCHAR(120) NULL,
    `bankAccountNumber` VARCHAR(20) NULL,
    `bankName` VARCHAR(80) NULL,
    `bkashNumber` VARCHAR(15) NULL,
    `nagadNumber` VARCHAR(15) NULL,
    `nidNumber` VARCHAR(30) NULL,
    `nidFrontImageUrl` VARCHAR(500) NULL,
    `nidBackImageUrl` VARCHAR(500) NULL,
    `status` ENUM('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'BANNED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
    `verifiedAt` DATETIME(3) NULL,
    `suspendedAt` DATETIME(3) NULL,
    `suspensionReason` VARCHAR(500) NULL,
    `totalRentals` INTEGER NOT NULL DEFAULT 0,
    `totalEarnings` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `averageRating` DOUBLE NOT NULL DEFAULT 0,
    `responseTimeMinutes` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vendor_profiles_userId_key`(`userId`),
    INDEX `vendor_profiles_userId_idx`(`userId`),
    INDEX `vendor_profiles_status_idx`(`status`),
    INDEX `vendor_profiles_district_idx`(`district`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_documents` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE') NOT NULL,
    `documentNumber` VARCHAR(30) NOT NULL,
    `fileUrl` VARCHAR(500) NOT NULL,
    `verifiedAt` DATETIME(3) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `verification_documents_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `emoji` VARCHAR(10) NOT NULL,
    `description` TEXT NULL,
    `parentId` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `categories_slug_key`(`slug`),
    INDEX `categories_slug_idx`(`slug`),
    INDEX `categories_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `pricePerDay` DECIMAL(10, 2) NOT NULL,
    `pricePerWeek` DECIMAL(10, 2) NULL,
    `pricePerMonth` DECIMAL(10, 2) NULL,
    `depositAmount` DECIMAL(10, 2) NOT NULL,
    `condition` ENUM('NEW', 'LIKE_NEW', 'GOOD', 'FAIR') NOT NULL DEFAULT 'GOOD',
    `status` ENUM('PENDING_REVIEW', 'ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'REJECTED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `brand` VARCHAR(80) NULL,
    `model` VARCHAR(80) NULL,
    `district` VARCHAR(60) NOT NULL,
    `division` VARCHAR(60) NOT NULL,
    `address` VARCHAR(200) NULL,
    `availableFrom` DATETIME(3) NULL,
    `availableUntil` DATETIME(3) NULL,
    `minRentalDays` INTEGER NOT NULL DEFAULT 1,
    `maxRentalDays` INTEGER NULL,
    `deliveryAvailable` BOOLEAN NOT NULL DEFAULT false,
    `deliveryFee` DECIMAL(8, 2) NULL,
    `deliveryOption` ENUM('SELLER_DELIVERY', 'CUSTOMER_PICKUP', 'COURIER') NOT NULL DEFAULT 'CUSTOMER_PICKUP',
    `deliveryOptions` JSON NOT NULL,
    `returnPickupFee` DECIMAL(8, 2) NULL,
    `specifications` JSON NULL,
    `tags` JSON NOT NULL,
    `totalRentals` INTEGER NOT NULL DEFAULT 0,
    `averageRating` DOUBLE NOT NULL DEFAULT 0,
    `reviewCount` INTEGER NOT NULL DEFAULT 0,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `isInstantBooking` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_slug_key`(`slug`),
    INDEX `products_vendorId_idx`(`vendorId`),
    INDEX `products_categoryId_idx`(`categoryId`),
    INDEX `products_status_idx`(`status`),
    INDEX `products_district_idx`(`district`),
    INDEX `products_division_idx`(`division`),
    INDEX `products_pricePerDay_idx`(`pricePerDay`),
    INDEX `products_averageRating_idx`(`averageRating`),
    INDEX `products_createdAt_idx`(`createdAt`),
    FULLTEXT INDEX `products_name_description_idx`(`name`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_media` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `altText` VARCHAR(200) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_media_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_blocked_dates` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `reason` VARCHAR(120) NULL,

    INDEX `product_blocked_dates_productId_idx`(`productId`),
    UNIQUE INDEX `product_blocked_dates_productId_date_key`(`productId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rentals` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `renterId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING_CONFIRMATION', 'CONFIRMED', 'READY_FOR_PICKUP', 'SHIPPED', 'ACTIVE', 'OVERDUE', 'RETURN_INITIATED', 'RETURN_IN_TRANSIT', 'RETURN_RECEIVED', 'DEPOSIT_PROCESSING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `totalDays` INTEGER NOT NULL,
    `pricePerDay` DECIMAL(10, 2) NOT NULL,
    `rentalFee` DECIMAL(12, 2) NOT NULL,
    `depositAmount` DECIMAL(10, 2) NOT NULL,
    `depositStatus` ENUM('HELD', 'PARTIAL_REFUND_PENDING', 'FULL_REFUND_PENDING', 'PARTIALLY_REFUNDED', 'FULLY_REFUNDED', 'FORFEITED') NOT NULL DEFAULT 'HELD',
    `platformFeeRate` DECIMAL(4, 4) NOT NULL DEFAULT 0.1000,
    `platformFee` DECIMAL(10, 2) NOT NULL,
    `vendorPayout` DECIMAL(12, 2) NOT NULL,
    `deliveryFee` DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(12, 2) NOT NULL,
    `deliveryOption` ENUM('SELLER_DELIVERY', 'CUSTOMER_PICKUP', 'COURIER') NULL,
    `selectedDelivery` ENUM('SELLER_DELIVERY', 'CUSTOMER_PICKUP', 'COURIER') NULL,
    `courierForwardFee` DECIMAL(8, 2) NULL,
    `courierReturnFee` DECIMAL(8, 2) NULL,
    `deliveryAddress` VARCHAR(300) NULL,
    `pickupAddress` VARCHAR(300) NULL,
    `returnAddress` VARCHAR(300) NULL,
    `renterNotes` VARCHAR(500) NULL,
    `vendorNotes` VARCHAR(500) NULL,
    `shipmentMethod` VARCHAR(60) NULL,
    `trackingNumber` VARCHAR(100) NULL,
    `estimatedDeliveryDate` DATETIME(3) NULL,
    `shippedAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `returnMethod` ENUM('SELLER_PICKUP', 'COURIER_RETURN', 'CUSTOMER_DROPOFF') NULL,
    `returnDate` DATETIME(3) NULL,
    `returnTrackingNumber` VARCHAR(100) NULL,
    `lateDays` INTEGER NOT NULL DEFAULT 0,
    `lateFeeAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `overdueNotifiedAt` DATETIME(3) NULL,
    `confirmedAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `returnInitiatedAt` DATETIME(3) NULL,
    `returnReceivedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancellationReason` ENUM('VENDOR_UNAVAILABLE', 'RENTER_REQUESTED', 'PAYMENT_FAILED', 'ITEM_DAMAGED', 'ITEM_NOT_AS_DESCRIBED', 'FRAUD_SUSPECTED', 'ADMIN_ACTION') NULL,
    `cancellationNote` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rentals_productId_idx`(`productId`),
    INDEX `rentals_renterId_idx`(`renterId`),
    INDEX `rentals_vendorId_idx`(`vendorId`),
    INDEX `rentals_status_idx`(`status`),
    INDEX `rentals_startDate_endDate_idx`(`startDate`, `endDate`),
    INDEX `rentals_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `late_fee_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `rentalId` VARCHAR(191) NOT NULL,
    `lateDays` INTEGER NOT NULL,
    `dailyRate` DECIMAL(10, 2) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `totalLateFee` DECIMAL(10, 2) NOT NULL,
    `depositRemaining` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `late_fee_transactions_rentalId_idx`(`rentalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `return_records` (
    `id` VARCHAR(191) NOT NULL,
    `rentalId` VARCHAR(191) NOT NULL,
    `reportedByVendor` BOOLEAN NOT NULL DEFAULT true,
    `condition` ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED') NOT NULL,
    `damageDescription` TEXT NULL,
    `damageAmount` DECIMAL(10, 2) NULL,
    `depositDeduction` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `depositRefund` DECIMAL(10, 2) NOT NULL,
    `lateDays` INTEGER NULL,
    `latePenalty` DECIMAL(10, 2) NULL,
    `outstandingDue` DECIMAL(10, 2) NULL,
    `vendorAgreed` BOOLEAN NOT NULL DEFAULT false,
    `renterAgreed` BOOLEAN NOT NULL DEFAULT false,
    `adminReviewRequired` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `return_records_rentalId_key`(`rentalId`),
    INDEX `return_records_rentalId_idx`(`rentalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `return_evidence` (
    `id` VARCHAR(191) NOT NULL,
    `returnRecordId` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(500) NOT NULL,
    `type` VARCHAR(10) NOT NULL,
    `uploadedBy` VARCHAR(191) NOT NULL,
    `description` VARCHAR(300) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `return_evidence_returnRecordId_idx`(`returnRecordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `rentalId` VARCHAR(191) NOT NULL,
    `payerId` VARCHAR(191) NOT NULL,
    `type` ENUM('RENTAL_PAYMENT', 'DEPOSIT', 'DEPOSIT_REFUND', 'VENDOR_PAYOUT', 'DAMAGE_DEDUCTION', 'LATE_FEE_DEDUCTION', 'PLATFORM_FEE') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'BDT',
    `method` ENUM('BKASH', 'NAGAD', 'ROCKET', 'CARD', 'BANK', 'CASH') NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `externalReference` VARCHAR(100) NULL,
    `gatewayTransactionId` VARCHAR(200) NULL,
    `gatewayResponse` JSON NULL,
    `initiatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `failedAt` DATETIME(3) NULL,
    `failureReason` VARCHAR(300) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payments_externalReference_key`(`externalReference`),
    INDEX `payments_rentalId_idx`(`rentalId`),
    INDEX `payments_payerId_idx`(`payerId`),
    INDEX `payments_status_idx`(`status`),
    INDEX `payments_externalReference_idx`(`externalReference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_payouts` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `rentalId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `method` ENUM('BKASH', 'NAGAD', 'ROCKET', 'CARD', 'BANK', 'CASH') NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    `transactionRef` VARCHAR(200) NULL,
    `processedAt` DATETIME(3) NULL,
    `failureReason` VARCHAR(300) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vendor_payouts_vendorId_idx`(`vendorId`),
    INDEX `vendor_payouts_rentalId_idx`(`rentalId`),
    INDEX `vendor_payouts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` VARCHAR(191) NOT NULL,
    `rentalId` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `title` VARCHAR(100) NULL,
    `body` TEXT NOT NULL,
    `vendorReply` TEXT NULL,
    `vendorRepliedAt` DATETIME(3) NULL,
    `helpfulCount` INTEGER NOT NULL DEFAULT 0,
    `isVerified` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reviews_rentalId_key`(`rentalId`),
    INDEX `reviews_productId_idx`(`productId`),
    INDEX `reviews_vendorId_idx`(`vendorId`),
    INDEX `reviews_reviewerId_idx`(`reviewerId`),
    INDEX `reviews_rating_idx`(`rating`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_feedback` (
    `id` VARCHAR(191) NOT NULL,
    `rentalId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `vendor_feedback_rentalId_key`(`rentalId`),
    INDEX `vendor_feedback_rentalId_idx`(`rentalId`),
    INDEX `vendor_feedback_customerId_idx`(`customerId`),
    INDEX `vendor_feedback_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disputes` (
    `id` VARCHAR(191) NOT NULL,
    `rentalId` VARCHAR(191) NOT NULL,
    `raisedById` VARCHAR(191) NOT NULL,
    `againstId` VARCHAR(191) NOT NULL,
    `type` ENUM('DAMAGE_CLAIM', 'ITEM_NOT_RETURNED', 'ITEM_NOT_AS_DESCRIBED', 'DEPOSIT_DISPUTE', 'PAYMENT_DISPUTE', 'VENDOR_NO_SHOW', 'OTHER') NOT NULL,
    `status` ENUM('OPEN', 'UNDER_REVIEW', 'AWAITING_EVIDENCE', 'RESOLVED_RENTER', 'RESOLVED_VENDOR', 'ESCALATED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `subject` VARCHAR(120) NOT NULL,
    `description` TEXT NOT NULL,
    `adminNotes` TEXT NULL,
    `resolution` VARCHAR(50) NULL,
    `resolutionNote` TEXT NULL,
    `depositDeduction` DECIMAL(10, 2) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolvedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `disputes_rentalId_key`(`rentalId`),
    INDEX `disputes_rentalId_idx`(`rentalId`),
    INDEX `disputes_raisedById_idx`(`raisedById`),
    INDEX `disputes_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dispute_evidence` (
    `id` VARCHAR(191) NOT NULL,
    `disputeId` VARCHAR(191) NOT NULL,
    `uploadedBy` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(500) NOT NULL,
    `description` VARCHAR(300) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `dispute_evidence_disputeId_idx`(`disputeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'RENTAL_STARTED', 'RETURN_REQUESTED', 'RETURN_CONFIRMED', 'DEPOSIT_REFUNDED', 'DEPOSIT_DEDUCTED', 'NEW_REVIEW', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'PAYMENT_RECEIVED', 'PAYOUT_PROCESSED', 'VENDOR_APPROVED', 'VENDOR_SUSPENDED', 'MESSAGE_RECEIVED', 'ITEM_SHIPPED', 'ITEM_DELIVERED', 'LATE_FEE_WARNING') NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `body` VARCHAR(500) NOT NULL,
    `data` JSON NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_readAt_idx`(`readAt`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wishlists` (
    `userId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wishlists_userId_idx`(`userId`),
    PRIMARY KEY (`userId`, `productId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` VARCHAR(191) NOT NULL,
    `rentalId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `attachmentUrl` VARCHAR(500) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `messages_rentalId_idx`(`rentalId`),
    INDEX `messages_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
