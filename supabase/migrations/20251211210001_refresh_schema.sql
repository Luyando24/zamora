-- Refresh schema cache for PostgREST
-- This migration ensures that the bar_menu_items table is recognized by the API
-- by making a trivial schema change (adding a comment).

COMMENT ON TABLE bar_menu_items IS 'Bar Menu Items Table';
COMMENT ON TABLE bar_menu_categories IS 'Bar Menu Categories Table';
