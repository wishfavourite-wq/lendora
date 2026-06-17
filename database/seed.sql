USE lendora;

INSERT INTO roles (id, name) VALUES
  (1, 'admin'),
  (2, 'seller'),
  (3, 'customer');

INSERT INTO users (id, role_id, name, email, phone, password_hash, status, email_verified_at, phone_verified_at) VALUES
  (1, 1, 'Lendora Admin', 'admin@lendora.test', '+8801700000001', '$2a$10$9k8Q77gFb9hO4jUmAh1REu4DAb3.tKTXUiBl7qkeqO2J6n9vNRh3.', 'active', NOW(), NOW()),
  (2, 2, 'Nadia Rahman', 'seller@lendora.test', '+8801700000002', '$2a$10$9k8Q77gFb9hO4jUmAh1REu4DAb3.tKTXUiBl7qkeqO2J6n9vNRh3.', 'active', NOW(), NOW()),
  (3, 3, 'Arif Hasan', 'customer@lendora.test', '+8801700000003', '$2a$10$9k8Q77gFb9hO4jUmAh1REu4DAb3.tKTXUiBl7qkeqO2J6n9vNRh3.', 'active', NOW(), NOW());

INSERT INTO sellers (id, user_id, store_name, bio, address, approval_status, approved_at) VALUES
  (1, 2, 'Nadia Gear Library', 'Verified rentals for cameras, drones, and event gear.', 'Dhanmondi, Dhaka', 'approved', NOW());

INSERT INTO customers (id, user_id, address, verification_status) VALUES
  (1, 3, 'Mirpur, Dhaka', 'verified');

INSERT INTO categories (id, name, slug, description, icon) VALUES
  (1, 'Electronics', 'electronics', 'Phones, laptops, displays, and accessories.', 'Laptop'),
  (2, 'Camera Equipment', 'camera-equipment', 'Cameras, lenses, stabilizers, and lights.', 'Camera'),
  (3, 'Drones', 'drones', 'Aerial cameras and drone kits.', 'Plane'),
  (4, 'Gaming Consoles', 'gaming-consoles', 'Console systems and controllers.', 'Gamepad2'),
  (5, 'Furniture', 'furniture', 'Furniture for short-term home and office needs.', 'Armchair'),
  (6, 'Home Appliances', 'home-appliances', 'Appliances for temporary use.', 'Home'),
  (7, 'Sports Equipment', 'sports-equipment', 'Fitness, outdoor, and game equipment.', 'Dumbbell'),
  (8, 'Tools', 'tools', 'Power tools and repair kits.', 'Wrench'),
  (9, 'Event Equipment', 'event-equipment', 'Audio, lighting, and party equipment.', 'Music'),
  (10, 'Fashion Rentals', 'fashion-rentals', 'Occasion wear and accessories.', 'Shirt');

INSERT INTO products
  (id, seller_id, category_id, name, description, specifications, condition_label, product_value, daily_rent, weekly_rent, monthly_rent, security_deposit, max_rental_duration, availability_calendar, status, approval_status)
VALUES
  (1, 1, 2, 'Sony Alpha Camera Kit', 'Mirrorless camera kit with lens, battery, and protective case for shoots and events.', JSON_OBJECT('sensor', 'Full frame', 'lens', '24-70mm', 'includes', 'case, charger, strap'), 'like_new', 220000, 3500, 19000, 62000, 30000, 21, JSON_OBJECT('blocked', JSON_ARRAY()), 'active', 'approved'),
  (2, 1, 3, 'DJI Drone Creator Bundle', 'Compact drone bundle for aerial photography with spare battery and controller.', JSON_OBJECT('flightTime', '31 minutes', 'video', '4K', 'includes', 'controller, battery'), 'good', 150000, 2800, 16000, 52000, 25000, 14, JSON_OBJECT('blocked', JSON_ARRAY()), 'active', 'approved'),
  (3, 1, 9, 'Portable Event Speaker Set', 'Two speaker event kit with wireless microphone and stands.', JSON_OBJECT('power', '800W', 'microphone', 'wireless', 'coverage', 'small events'), 'good', 90000, 1800, 9500, 32000, 12000, 30, JSON_OBJECT('blocked', JSON_ARRAY()), 'active', 'approved');

INSERT INTO product_images (product_id, image_url, is_cover, sort_order) VALUES
  (1, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80', TRUE, 0),
  (2, 'https://images.unsplash.com/photo-1508444845599-5c89863b1c44?auto=format&fit=crop&w=1200&q=80', TRUE, 0),
  (3, 'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1200&q=80', TRUE, 0);

INSERT INTO ratings (user_id, average_rating, total_reviews) VALUES
  (2, 4.8, 124),
  (3, 4.6, 18);
