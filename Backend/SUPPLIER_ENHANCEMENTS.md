# Supplier Controller Enhancements

## Changes Made

### 1. Added New Fields

- **VAT**: `vat` field for VAT registration number
- **Bank Details**:
  - `bank_name`: Name of the bank
  - `branch`: Bank branch
  - `account_number`: Bank account number

### 2. Enhanced Payment Terms

- Changed from simple `payment` field to `payment_terms` with conditional fields:
  - **Credit**: When selected, requires `credit_period` (number of days)
  - **Advance**: When selected, requires `advance_percentage` (percentage value)
  - **Cash**: No additional fields required

### 3. Custom Supplier ID Generation

- Generated supplier IDs now start with "SUP" prefix
- Format: `SUP{company_code}{timestamp}{random}`
- Example: `SUPVCM12345678901`
- Ensures unique IDs across companies
- **Automatically generated** when creating a new supplier

## API Changes

### Add Supplier (POST /add-suppliers)

**New Request Body:**

```json
{
  "company_code": "VCM",
  "supplier_name": "ABC Suppliers Ltd",
  "email": "contact@abc.com",
  "phone": "+44123456789",
  "address": "123 Business St, London",
  "brn": "BR123456",
  "vat": "VAT123456789",
  "bank_name": "Barclays Bank",
  "branch": "London Branch",
  "account_number": "12345678",
  "payment_terms": "Credit", // or "Advance" or "Cash"
  "credit_period": 30, // Required only if payment_terms is "Credit"
  "advance_percentage": 50, // Required only if payment_terms is "Advance"
  "created_by": "admin_user"
}
```

### Update Supplier (PUT /update-suppliers/:supplier_id)

**New Request Body:** (Same structure as add, without created_by)

**Response:**

```json
{
  "success": true,
  "supplier_id": "SUPVCM12345678901"
}
```

## Validation Rules

1. **Required Fields**: company_code, supplier_name, payment_terms, created_by
2. **Payment Terms Validation**:
   - If payment_terms = "Credit", credit_period is required
   - If payment_terms = "Advance", advance_percentage is required
3. **Duplicate Prevention**: Same supplier name within same company not allowed

## Database Schema Changes Required

You'll need to update your suppliers table to include these new columns:

```sql
ALTER TABLE suppliers
ADD COLUMN credit_period INT NULL,
ADD COLUMN advance_percentage DECIMAL(5,2) NULL,
ADD COLUMN vat VARCHAR(50),
ADD COLUMN bank_name VARCHAR(100),
ADD COLUMN branch VARCHAR(100),
ADD COLUMN account_number VARCHAR(50),
MODIFY COLUMN supplier_id VARCHAR(50) PRIMARY KEY;
```

## Frontend Integration Tips

1. **Payment Terms Form**:

   - Show dropdown with options: Cash, Credit, Advance
   - Conditionally show credit_period input when "Credit" is selected
   - Conditionally show advance_percentage input when "Advance" is selected

2. **Supplier ID Display**:

   - Supplier ID is automatically generated and returned in the response after creation
   - No need for preview endpoints - the ID is created when the supplier is added

3. **Form Validation**:
   - Validate required fields based on payment terms selection
   - Ensure credit_period is a positive integer
   - Ensure advance_percentage is between 0-100
