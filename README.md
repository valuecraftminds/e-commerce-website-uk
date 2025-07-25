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



CREATE TABLE grn (
    grn_id VARCHAR(20) PRIMARY KEY,
    company_code VARCHAR(10) NOT NULL,
    style_code VARCHAR(50) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    quantity_in INT NOT NULL,
    received_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    warehouse_user_id int(11) NOT NULL,
    location VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
);














# sample data

export const CLOTHING_COLORS = [
{ name: 'Black', code: '#000000' },
{ name: 'White', code: '#FFFFFF' },
{ name: 'Navy Blue', code: '#000080' },
{ name: 'Royal Blue', code: '#4169E1' },
{ name: 'Light Blue', code: '#ADD8E6' },
{ name: 'Red', code: '#FF0000' },
{ name: 'Burgundy', code: '#800020' },
{ name: 'Pink', code: '#FFC0CB' },
{ name: 'Hot Pink', code: '#FF69B4' },
{ name: 'Yellow', code: '#FFFF00' },
{ name: 'Mustard', code: '#FFDB58' },
{ name: 'Green', code: '#008000' },
{ name: 'Olive Green', code: '#808000' },
{ name: 'Mint Green', code: '#98FF98' },
{ name: 'Brown', code: '#A52A2A' },
{ name: 'Beige', code: '#F5F5DC' },
{ name: 'Grey', code: '#808080' },
{ name: 'Light Grey', code: '#D3D3D3' },
{ name: 'Purple', code: '#800080' },
{ name: 'Lavender', code: '#E6E6FA' },
{ name: 'Orange', code: '#FFA500' },
{ name: 'Coral', code: '#FF7F50' },
{ name: 'Khaki', code: '#F0E68C' },
{ name: 'Cream', code: '#FFFDD0' }
];

export const CLOTHING_SIZES = {
REGULAR: [
{ name: 'XS', order: 1 },
{ name: 'S', order: 2 },
{ name: 'M', order: 3 },
{ name: 'L', order: 4 },
{ name: 'XL', order: 5 },
{ name: 'XXL', order: 6 },
{ name: '3XL', order: 7 }
],
NUMERIC: [
{ name: '36', order: 1 },
{ name: '38', order: 2 },
{ name: '40', order: 3 },
{ name: '42', order: 4 },
{ name: '44', order: 5 },
{ name: '46', order: 6 }
],
UK: [
{ name: 'UK 6', order: 1 },
{ name: 'UK 8', order: 2 },
{ name: 'UK 10', order: 3 },
{ name: 'UK 12', order: 4 },
{ name: 'UK 14', order: 5 },
{ name: 'UK 16', order: 6 }
]
};

export const CLOTHING_MATERIALS = [
{
name: 'Cotton',
description: '100% Natural cotton fabric, breathable and comfortable'
},
{
name: 'Polyester',
description: 'Durable synthetic fabric with moisture-wicking properties'
},
{
name: 'Cotton-Polyester Blend',
description: '60% Cotton 40% Polyester blend for comfort and durability'
},
{
name: 'Linen',
description: 'Natural fabric perfect for summer wear'
},
{
name: 'Wool',
description: 'Natural insulating fabric for winter wear'
},
{
name: 'Denim',
description: 'Sturdy cotton twill fabric for jeans and jackets'
},
{
name: 'Silk',
description: 'Luxurious natural fabric with smooth texture'
},
{
name: 'Viscose',
description: 'Semi-synthetic fabric with silk-like feel'
},
{
name: 'Elastane Blend',
description: '95% Cotton 5% Elastane for stretch and comfort'
},
{
name: 'Jersey',
description: 'Soft knitted fabric for t-shirts and casual wear'
}
];

export const CLOTHING_FITS = [
{
name: 'Regular Fit',
description: 'Standard fit with room for movement, neither tight nor loose'
},
{
name: 'Slim Fit',
description: 'Tailored closer to the body for a modern silhouette'
},
{
name: 'Relaxed Fit',
description: 'Looser fit throughout for maximum comfort'
},
{
name: 'Skinny Fit',
description: 'Very close-fitting throughout the garment'
},
{
name: 'Classic Fit',
description: 'Traditional cut with comfortable room throughout'
},
{
name: 'Straight Fit',
description: 'Consistent width from hip to ankle'
},
{
name: 'Tailored Fit',
description: 'Moderately slim cut for a sharp appearance'
},
{
name: 'Oversized Fit',
description: 'Intentionally larger cut for a loose, casual style'
}
];
