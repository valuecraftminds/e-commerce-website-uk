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

CREATE TABLE style (
style_id INT AUTO_INCREMENT PRIMARY KEY,
company_code VARCHAR(50) NOT NULL,
style_code VARCHAR(50) NOT NULL UNIQUE,
name VARCHAR(255) NOT NULL,
description TEXT,
category_id INT,
image VARCHAR(500),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL ON UPDATE CASCADE,
INDEX idx_style_code (style_code),
INDEX idx_category_id (category_id)
);

CREATE TABLE style_variants (
variant_id INT AUTO_INCREMENT PRIMARY KEY,
company_code VARCHAR(10) NOT NULL,
style_code VARCHAR(50) NOT NULL,
color VARCHAR(100) NOT NULL,
size VARCHAR(50) NOT NULL,
fit VARCHAR(100),
material VARCHAR(200),
price DECIMAL(10, 2) NOT NULL,
stock_quantity INT DEFAULT 0,
sku VARCHAR(100) UNIQUE,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
INDEX idx_style_code (style_code),
INDEX idx_sku (sku)
);
