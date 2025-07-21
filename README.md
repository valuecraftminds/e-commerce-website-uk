# e-commerce-website-uk

Developing E-Commerce Website

Initial step -1

Database Structure

- Admin panel

CREATE TABLE admin_users (
user_id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(100) NOT NULL UNIQUE,
password VARCHAR(255) NOT NULL,
role ENUM('Admin', 'PDC', 'Warehouse_GRN', 'Warehouse_Issuing', 'Accounting') NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
category_id INT AUTO_INCREMENT PRIMARY KEY,
company_code VARCHAR(10) NULL,
category_name VARCHAR(100) NOT NULL,
parent_id INT NULL,
FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE CASCADE

);

CREATE TABLE styles (
style_id INT AUTO_INCREMENT PRIMARY KEY,
style_code VARCHAR(50) UNIQUE NOT NULL,
name VARCHAR(100) NOT NULL,
description TEXT,
category_id INT NOT NULL,
base_price DECIMAL(10,2) NOT NULL,
is_active BOOLEAN DEFAULT TRUE,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- Product variants table (handles all combinations and prices)
CREATE TABLE product_variants (
variant_id INT AUTO_INCREMENT PRIMARY KEY,
style_id INT NOT NULL,
sku VARCHAR(100) UNIQUE NOT NULL,
size VARCHAR(50),
color VARCHAR(50),
fit VARCHAR(50),
material VARCHAR(100),
price DECIMAL(10,2) NOT NULL,    -- ✅ Each variant has its own price
stock_quantity INT DEFAULT 0,
image VARCHAR(255),
is_active BOOLEAN DEFAULT TRUE,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (style_id) REFERENCES styles(style_id) ON DELETE CASCADE
);

-- Updated GRN table
CREATE TABLE grn (
grn_id INT AUTO_INCREMENT PRIMARY KEY,
variant_id INT NOT NULL,         -- ✅ Links to specific variant
quantity_in INT NOT NULL,
received_date DATETIME DEFAULT CURRENT_TIMESTAMP,
warehouse_user INT NOT NULL,
FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE CASCADE,
FOREIGN KEY (warehouse_user) REFERENCES admin_users(user_id) ON DELETE CASCADE
);

-- Updated issuing table
CREATE TABLE issuing (
issue_id INT AUTO_INCREMENT PRIMARY KEY,
variant_id INT NOT NULL,         -- ✅ Links to specific variant
quantity_out INT NOT NULL,
issued_date DATETIME DEFAULT CURRENT_TIMESTAMP,
warehouse_user INT NOT NULL,
FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE CASCADE,
FOREIGN KEY (warehouse_user) REFERENCES admin_users(user_id) ON DELETE CASCADE
);

