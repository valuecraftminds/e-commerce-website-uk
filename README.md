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
category_name VARCHAR(100) NOT NULL,
parent_id INT NULL,
FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

CREATE TABLE styles (
item_code VARCHAR(50) PRIMARY KEY,
name VARCHAR(100) NOT NULL,
description TEXT,
category_id INT NOT NULL,
size VARCHAR(50),
color VARCHAR(50),
fit VARCHAR(50),
material VARCHAR(100),
style_type VARCHAR(50),
image VARCHAR(255),
price DECIMAL(10,2),
quantity INT DEFAULT 0,
FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

CREATE TABLE grn (
grn_id INT AUTO_INCREMENT PRIMARY KEY,
item_code VARCHAR(50) NOT NULL,
quantity_in INT NOT NULL,
received_date DATETIME DEFAULT CURRENT_TIMESTAMP,
warehouse_user INT NOT NULL,
FOREIGN KEY (item_code) REFERENCES styles(item_code) ON DELETE CASCADE,
FOREIGN KEY (warehouse_user) REFERENCES admin_users(user_id) ON DELETE CASCADE
);

CREATE TABLE issuing (
issue_id INT AUTO_INCREMENT PRIMARY KEY,
item_code VARCHAR(50) NOT NULL,
quantity_out INT NOT NULL,
issued_date DATETIME DEFAULT CURRENT_TIMESTAMP,
warehouse_user INT NOT NULL,
FOREIGN KEY (item_code) REFERENCES styles(item_code) ON DELETE CASCADE,
FOREIGN KEY (warehouse_user) REFERENCES admin_users(user_id) ON DELETE CASCADE
);


