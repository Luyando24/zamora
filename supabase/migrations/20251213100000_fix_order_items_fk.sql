-- Fix foreign key constraint on order_items to allow menu_items deletion
-- The previous constraint prevented deleting menu items that had associated orders.
-- We change this to ON DELETE SET NULL to preserve the order history even if the item is deleted.

ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;

ALTER TABLE order_items
ADD CONSTRAINT order_items_menu_item_id_fkey
FOREIGN KEY (menu_item_id)
REFERENCES menu_items(id)
ON DELETE SET NULL;
