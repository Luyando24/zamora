-- Add missing columns to bar_menu_items to support the frontend form
-- These columns are used in MenuWizard.tsx but were missing from the table definition

ALTER TABLE bar_menu_items 
ADD COLUMN IF NOT EXISTS weight TEXT, -- Used for Volume/Size (e.g., 330ml)
ADD COLUMN IF NOT EXISTS ingredients TEXT, -- Used for Mixers/Ingredients
ADD COLUMN IF NOT EXISTS original_price NUMERIC, -- Used for crossed-out price
ADD COLUMN IF NOT EXISTS discount_badge TEXT, -- Used for "Happy Hour", etc.
ADD COLUMN IF NOT EXISTS dietary_info TEXT, -- Used for Alcohol % or Type
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT ARRAY[]::TEXT[], -- Additional images
ADD COLUMN IF NOT EXISTS customization_options JSONB DEFAULT '[]'::jsonb; -- Extras/Options
