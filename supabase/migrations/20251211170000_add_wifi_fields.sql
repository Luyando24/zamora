-- Add Wi-Fi fields to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS wifi_ssid TEXT,
ADD COLUMN IF NOT EXISTS wifi_password TEXT;
