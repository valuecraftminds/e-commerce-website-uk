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


# Add these table definitions after existing tables

CREATE TABLE colors (
    color_id INT AUTO_INCREMENT PRIMARY KEY,
    company_code VARCHAR(10) NOT NULL,
    color_name VARCHAR(100) NOT NULL,
    color_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_color (company_code, color_name)
);

CREATE TABLE sizes (
    size_id INT AUTO_INCREMENT PRIMARY KEY,
    company_code VARCHAR(10) NOT NULL,
    size_name VARCHAR(50) NOT NULL,
    size_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_size (company_code, size_name)
);

CREATE TABLE materials (
    material_id INT AUTO_INCREMENT PRIMARY KEY,
    company_code VARCHAR(10) NOT NULL,
    material_name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_material (company_code, material_name)
);

CREATE TABLE fits (
    fit_id INT AUTO_INCREMENT PRIMARY KEY,
    company_code VARCHAR(10) NOT NULL,
    fit_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_fit (company_code, fit_name)
);

# Then modify the style_variants table to include foreign keys

ALTER TABLE style_variants
ADD COLUMN color_id INT,
ADD COLUMN size_id INT,
ADD COLUMN material_id INT,
ADD COLUMN fit_id INT,
ADD FOREIGN KEY (color_id) REFERENCES colors(color_id) ON DELETE RESTRICT,
ADD FOREIGN KEY (size_id) REFERENCES sizes(size_id) ON DELETE RESTRICT,
ADD FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
ADD FOREIGN KEY (fit_id) REFERENCES fits(fit_id) ON DELETE RESTRICT;