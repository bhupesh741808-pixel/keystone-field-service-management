-- Add payment columns to service_requests table
ALTER TABLE service_requests
ADD COLUMN amount DECIMAL(38,2) DEFAULT 0.00,
ADD COLUMN payment_status VARCHAR(255) DEFAULT 'UNPAID',
ADD COLUMN razorpay_order_id VARCHAR(255),
ADD COLUMN razorpay_payment_id VARCHAR(255);
