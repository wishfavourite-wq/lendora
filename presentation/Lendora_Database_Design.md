# Lendora — Database Design Reference

22 entities covering the full rental marketplace workflow: identity & verification,
shop & catalog, the rental transaction lifecycle, payments & deposits, delivery &
returns, late fees & damage, refunds & commission, and reviews/notifications.

> **Note on FKs:** in strict Chen ER notation, foreign keys are *implied* by the
> relationship diamonds connecting two entities — they are not drawn as separate
> attribute ellipses. The FK column below documents the same information in
> table form for the written report / physical schema.

## 1. Identity & Verification

| Entity | Attributes | PK | FK |
|---|---|---|---|
| **Admin** | adminId, name, email, password, role | adminId | — |
| **Seller** | sellerId, name, email, password, phone, status | sellerId | — |
| **Customer** | customerId, name, email, password, phone | customerId | — |
| **Verification** | verificationId, documentType, documentNumber, status | verificationId | sellerId → Seller (nullable), customerId → Customer (nullable), verifiedBy → Admin |

## 2. Shop & Catalog

| Entity | Attributes | PK | FK |
|---|---|---|---|
| **Shop** | shopId, shopName, district, bkashNumber, status | shopId | sellerId → Seller |
| **Category** | categoryId, name, slug | categoryId | parentCategoryId → Category (self, nullable) |
| **Product** | productId, name, pricePerDay, depositAmount, status, tags *(multivalued)* | productId | shopId → Shop, categoryId → Category |
| **ProductImage** | imageId, imageUrl, isPrimary | imageId | productId → Product |

## 3. Rental Transaction

| Entity | Attributes | PK | FK |
|---|---|---|---|
| **RentalRequest** | requestId, startDate, endDate, status | requestId | customerId → Customer, productId → Product |
| **RentalOrder** | orderId, totalAmount, status, confirmedAt | orderId | requestId → RentalRequest, sellerId → Seller |
| **OrderStatusHistory** | historyId, status, changedAt | historyId | orderId → RentalOrder |

## 4. Payments, Deposits & Commission

| Entity | Attributes | PK | FK |
|---|---|---|---|
| **Payment** | paymentId, amount, method, status | paymentId | orderId → RentalOrder |
| **SecurityDeposit** | depositId, amount, status | depositId | orderId → RentalOrder |
| **WalletTransaction** | transactionId, amount, type, balanceAfter | transactionId | sellerId → Seller |
| **PlatformCommission** | commissionId, rate, amount | commissionId | orderId → RentalOrder |

## 5. Delivery & Returns

| Entity | Attributes | PK | FK |
|---|---|---|---|
| **DeliveryInfo** | deliveryId, method, address, trackingNumber | deliveryId | orderId → RentalOrder |
| **ReturnRequest** | returnId, returnDate, condition, status | returnId | orderId → RentalOrder |
| **LateFeeRecord** | lateFeeId, lateDays, amount | lateFeeId | orderId → RentalOrder |
| **DamageClaim** | claimId, claimedAmount, approvedAmount, status | claimId | returnId → ReturnRequest |
| **DepositRefund** | refundId, amount, refundedAt | refundId | depositId → SecurityDeposit |

## 6. Engagement

| Entity | Attributes | PK | FK |
|---|---|---|---|
| **Review** | reviewId, rating, comment | reviewId | orderId → RentalOrder, customerId → Customer |
| **Notification** | notificationId, type, message, isRead | notificationId | customerId → Customer (nullable), sellerId → Seller (nullable) |

---

## Relationships & Cardinality

| # | Relationship | Cardinality |
|---|---|---|
| 1 | Seller — Owns — Shop | 1 : 1 |
| 2 | Shop — Lists — Product | 1 : N |
| 3 | Category — Classifies — Product | 1 : N |
| 4 | Product — Has — ProductImage | 1 : N |
| 5 | Customer — Submits — Verification | 1 : N |
| 6 | Seller — Submits — Verification | 1 : N |
| 7 | Admin — Reviews — Verification | 1 : N |
| 8 | Customer — Creates — RentalRequest | 1 : N |
| 9 | Product — RequestedFor — RentalRequest | 1 : N |
| 10 | RentalRequest — ApprovedAs — RentalOrder | 1 : 1 |
| 11 | Seller — Fulfills — RentalOrder | 1 : N |
| 12 | RentalOrder — Has — Payment | 1 : N |
| 13 | RentalOrder — Has — SecurityDeposit | 1 : 1 |
| 14 | RentalOrder — Has — DeliveryInfo | 1 : 1 |
| 15 | RentalOrder — Generates — LateFeeRecord | 1 : N |
| 16 | RentalOrder — Generates — PlatformCommission | 1 : 1 |
| 17 | RentalOrder — Logs — OrderStatusHistory | 1 : N |
| 18 | Seller — Earns — WalletTransaction | 1 : N |
| 19 | RentalOrder — Initiates — ReturnRequest | 1 : 1 |
| 20 | ReturnRequest — Raises — DamageClaim | 1 : 1 |
| 21 | SecurityDeposit — ResultsIn — DepositRefund | 1 : 1 |
| 22 | RentalOrder — Receives — Review | 1 : 1 |
| 23 | Customer — Writes — Review | 1 : N |
| 24 | Customer — Receives — Notification | 1 : N |
| 25 | Seller — Receives — Notification | 1 : N |

---

## Business Logic → Entity Mapping

| Business Logic | Entities Involved |
|---|---|
| Seller & customer verification | Seller, Customer, Verification, Admin |
| Product publishing | Seller, Shop, Category, Product, ProductImage |
| Rental requests | Customer, Product, RentalRequest |
| Seller approval → order | RentalRequest, RentalOrder, Seller |
| Demo bKash payments | RentalOrder, Payment |
| Security deposits | RentalOrder, SecurityDeposit |
| Delivery & returns | DeliveryInfo, ReturnRequest, OrderStatusHistory |
| Automatic late fee deduction | RentalOrder, LateFeeRecord, WalletTransaction |
| Damage compensation | ReturnRequest, DamageClaim, WalletTransaction |
| Deposit refunds | SecurityDeposit, DepositRefund |
| Seller commission | RentalOrder, PlatformCommission, WalletTransaction |
| Reviews and ratings | RentalOrder, Customer, Review |
| Admin monitoring | Admin, RentalOrder, Verification, DamageClaim |
