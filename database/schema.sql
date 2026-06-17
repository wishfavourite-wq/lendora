CREATE DATABASE IF NOT EXISTS lendora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lendora;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS qr_codes;
DROP TABLE IF EXISTS rental_extensions;
DROP TABLE IF EXISTS disputes;
DROP TABLE IF EXISTS damage_claims;
DROP TABLE IF EXISTS customer_verifications;
DROP TABLE IF EXISTS seller_verifications;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS wishlists;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS refunds;
DROP TABLE IF EXISTS returns;
DROP TABLE IF EXISTS deposits;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS rentals;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_videos;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS sellers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name ENUM('admin', 'seller', 'customer') NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  role_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(40) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  status ENUM('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
  email_verified_at TIMESTAMP NULL,
  phone_verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE sellers (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  store_name VARCHAR(190) NOT NULL,
  bio TEXT,
  address TEXT,
  approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sellers_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE customers (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  address TEXT,
  verification_status ENUM('unverified', 'pending', 'verified', 'rejected') NOT NULL DEFAULT 'unverified',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  seller_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(220) NOT NULL,
  description TEXT NOT NULL,
  specifications JSON,
  condition_label ENUM('new', 'like_new', 'good', 'fair') NOT NULL DEFAULT 'good',
  product_value DECIMAL(12,2) NOT NULL,
  daily_rent DECIMAL(12,2) NOT NULL,
  weekly_rent DECIMAL(12,2) NOT NULL,
  monthly_rent DECIMAL(12,2) NOT NULL,
  security_deposit DECIMAL(12,2) NOT NULL DEFAULT 0,
  max_rental_duration INT NOT NULL DEFAULT 30,
  availability_calendar JSON,
  status ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'draft',
  approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_search (category_id, approval_status, status, daily_rent),
  CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES sellers(id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE product_images (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE product_videos (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  video_url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_videos_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE orders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  seller_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  rental_fee DECIMAL(12,2) NOT NULL,
  deposit_amount DECIMAL(12,2) NOT NULL,
  status ENUM('placed', 'payment_completed', 'seller_approved', 'active', 'return_requested', 'completed', 'cancelled') NOT NULL DEFAULT 'placed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_orders_seller FOREIGN KEY (seller_id) REFERENCES sellers(id),
  CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE rentals (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL UNIQUE,
  customer_id BIGINT UNSIGNED NOT NULL,
  seller_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  rental_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  actual_return_date DATE NULL,
  status ENUM('pending', 'approved', 'active', 'return_requested', 'completed', 'overdue', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rentals_booking (product_id, status, start_date, end_date),
  CONSTRAINT fk_rentals_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_rentals_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_rentals_seller FOREIGN KEY (seller_id) REFERENCES sellers(id),
  CONSTRAINT fk_rentals_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE payments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  gateway ENUM('bkash', 'manual') NOT NULL DEFAULT 'bkash',
  transaction_id VARCHAR(190),
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('initiated', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'initiated',
  gateway_payload JSON,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE deposits (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL UNIQUE,
  amount DECIMAL(12,2) NOT NULL,
  held_amount DECIMAL(12,2) NOT NULL,
  refunded_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('held', 'partial_released', 'released', 'forfeited') NOT NULL DEFAULT 'held',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_deposits_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE returns (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  rental_id BIGINT UNSIGNED NOT NULL,
  requested_by BIGINT UNSIGNED NOT NULL,
  status ENUM('requested', 'approved', 'damage_reported', 'disputed') NOT NULL DEFAULT 'requested',
  notes TEXT,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_returns_rental FOREIGN KEY (rental_id) REFERENCES rentals(id),
  CONSTRAINT fk_returns_user FOREIGN KEY (requested_by) REFERENCES users(id)
);

CREATE TABLE refunds (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  deposit_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  deduction_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  reason VARCHAR(255),
  status ENUM('pending', 'approved', 'paid', 'rejected') NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refunds_deposit FOREIGN KEY (deposit_id) REFERENCES deposits(id)
);

CREATE TABLE reviews (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  rental_id BIGINT UNSIGNED NOT NULL,
  reviewer_user_id BIGINT UNSIGNED NOT NULL,
  reviewed_user_id BIGINT UNSIGNED NOT NULL,
  communication TINYINT NOT NULL,
  product_quality TINYINT NOT NULL,
  timely_return TINYINT NOT NULL,
  overall_experience TINYINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_rental FOREIGN KEY (rental_id) REFERENCES rentals(id),
  CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_user_id) REFERENCES users(id),
  CONSTRAINT fk_reviews_reviewed FOREIGN KEY (reviewed_user_id) REFERENCES users(id)
);

CREATE TABLE ratings (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  average_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  total_reviews INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE wishlists (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist (user_id, product_id),
  CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_wishlists_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE notifications (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(190) NOT NULL,
  body TEXT NOT NULL,
  type ENUM('dashboard', 'email', 'sms') NOT NULL DEFAULT 'dashboard',
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE messages (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  receiver_id BIGINT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id)
);

CREATE TABLE support_tickets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  subject VARCHAR(220) NOT NULL,
  body TEXT NOT NULL,
  status ENUM('open', 'pending', 'solved') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_support_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE seller_verifications (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  seller_id BIGINT UNSIGNED NOT NULL,
  nid_number VARCHAR(80),
  address TEXT,
  profile_photo_url VARCHAR(500),
  nid_front_url VARCHAR(500),
  phone_verified_at TIMESTAMP NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_seller_verifications_seller FOREIGN KEY (seller_id) REFERENCES sellers(id)
);

CREATE TABLE customer_verifications (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  nid_number VARCHAR(80),
  email_verified_at TIMESTAMP NULL,
  phone_verified_at TIMESTAMP NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_customer_verifications_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE damage_claims (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  rental_id BIGINT UNSIGNED NOT NULL,
  seller_id BIGINT UNSIGNED NOT NULL,
  description TEXT NOT NULL,
  estimated_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
  evidence_json JSON,
  status ENUM('open', 'accepted', 'disputed', 'resolved') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_damage_claims_rental FOREIGN KEY (rental_id) REFERENCES rentals(id),
  CONSTRAINT fk_damage_claims_seller FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE TABLE disputes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  rental_id BIGINT UNSIGNED NOT NULL,
  opened_by BIGINT UNSIGNED NOT NULL,
  reason ENUM('damage', 'missing_item', 'late_return', 'wrong_product_returned') NOT NULL,
  description TEXT NOT NULL,
  status ENUM('open', 'under_review', 'resolved') NOT NULL DEFAULT 'open',
  admin_decision ENUM('full_refund', 'partial_refund', 'no_refund') NULL,
  admin_notes TEXT,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_disputes_rental FOREIGN KEY (rental_id) REFERENCES rentals(id),
  CONSTRAINT fk_disputes_user FOREIGN KEY (opened_by) REFERENCES users(id)
);

CREATE TABLE rental_extensions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  rental_id BIGINT UNSIGNED NOT NULL,
  requested_end_date DATE NOT NULL,
  additional_rent DECIMAL(12,2) NOT NULL,
  status ENUM('pending_payment', 'approved', 'rejected') NOT NULL DEFAULT 'pending_payment',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rental_extensions_rental FOREIGN KEY (rental_id) REFERENCES rentals(id)
);

CREATE TABLE qr_codes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  rental_id BIGINT UNSIGNED NOT NULL,
  code_type ENUM('order', 'pickup', 'return') NOT NULL,
  code_payload JSON NOT NULL,
  scanned_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_qr_codes_rental FOREIGN KEY (rental_id) REFERENCES rentals(id)
);

-- Refresh tokens for long-lived sessions (rotatable)
CREATE TABLE refresh_tokens (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_token (token)
);

-- Password reset tokens (single use)
CREATE TABLE password_resets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_password_reset_token (token)
);
