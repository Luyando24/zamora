-- Add Admin Notification Phone to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS admin_notification_phone TEXT;
