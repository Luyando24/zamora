/**
 * Stock Deduction Utility
 * 
 * Handles automatic stock deduction when orders are completed.
 * Called when an order status is updated to 'pos_completed' or 'delivered'.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface StockDeductionResult {
    success: boolean;
    deductions: Array<{
        inventoryItemId: string;
        itemName: string;
        quantityDeducted: number;
        unit: string;
        newQuantity: number;
    }>;
    errors: string[];
}

/**
 * Deduct stock for a completed food order.
 * Looks up recipes for each menu item in the order and deducts accordingly.
 */
export async function deductStockForFoodOrder(
    supabase: SupabaseClient,
    orderId: string,
    propertyId: string,
    performedBy?: string
): Promise<StockDeductionResult> {
    const deductions: StockDeductionResult['deductions'] = [];
    const errors: string[] = [];

    try {
        // 1. Fetch order items for this order
        const { data: orderItems, error: orderError } = await supabase
            .from('order_items')
            .select('menu_item_id, quantity')
            .eq('order_id', orderId);

        if (orderError) {
            errors.push(`Failed to fetch order items: ${orderError.message}`);
            return { success: false, deductions, errors };
        }

        if (!orderItems || orderItems.length === 0) {
            return { success: true, deductions, errors }; // No items to process
        }

        // 2. Get unique menu item IDs
        const menuItemIds = Array.from(new Set(orderItems.map(i => i.menu_item_id).filter(Boolean)));

        if (menuItemIds.length === 0) {
            return { success: true, deductions, errors };
        }

        // 3. Fetch recipes for these menu items
        const { data: recipes, error: recipeError } = await supabase
            .from('menu_item_recipes')
            .select(`
        menu_item_id,
        inventory_item_id,
        quantity_per_unit,
        inventory_items (id, name, quantity, unit)
      `)
            .in('menu_item_id', menuItemIds)
            .eq('property_id', propertyId);

        if (recipeError) {
            errors.push(`Failed to fetch recipes: ${recipeError.message}`);
            return { success: false, deductions, errors };
        }

        if (!recipes || recipes.length === 0) {
            // No recipes defined - just return success (stock tracking not configured)
            return { success: true, deductions, errors };
        }

        // 4. Calculate total deductions per inventory item
        const deductionMap: Map<string, { quantity: number; itemName: string; unit: string }> = new Map();

        for (const orderItem of orderItems) {
            const itemRecipes = recipes.filter(r => r.menu_item_id === orderItem.menu_item_id);

            for (const recipe of itemRecipes) {
                const totalToDeduct = (recipe.quantity_per_unit || 1) * (orderItem.quantity || 1);
                const invItem = recipe.inventory_items as any;

                if (invItem) {
                    const existing = deductionMap.get(recipe.inventory_item_id) || {
                        quantity: 0,
                        itemName: invItem.name,
                        unit: invItem.unit || 'unit'
                    };
                    existing.quantity += totalToDeduct;
                    deductionMap.set(recipe.inventory_item_id, existing);
                }
            }
        }

        // 5. Apply deductions
        for (const [inventoryItemId, { quantity, itemName, unit }] of Array.from(deductionMap)) {
            // Get current quantity
            const { data: currentItem, error: fetchErr } = await supabase
                .from('inventory_items')
                .select('quantity')
                .eq('id', inventoryItemId)
                .single();

            if (fetchErr || !currentItem) {
                errors.push(`Failed to fetch inventory item ${itemName}: ${fetchErr?.message}`);
                continue;
            }

            const newQuantity = Math.max(0, (currentItem.quantity || 0) - quantity);

            // Update inventory
            const { error: updateErr } = await supabase
                .from('inventory_items')
                .update({
                    quantity: newQuantity,
                    updated_at: new Date().toISOString()
                })
                .eq('id', inventoryItemId);

            if (updateErr) {
                errors.push(`Failed to update ${itemName}: ${updateErr.message}`);
                continue;
            }

            // Log transaction
            const { error: txnErr } = await supabase
                .from('inventory_transactions')
                .insert({
                    item_id: inventoryItemId,
                    type: 'out',
                    quantity: -quantity, // Negative for deduction
                    reason: `Order ${orderId.slice(0, 8)} completed`,
                    cost_at_time: null, // Could calculate if needed
                    performed_by: performedBy || null
                });

            if (txnErr) {
                errors.push(`Failed to log transaction for ${itemName}: ${txnErr.message}`);
            }

            deductions.push({
                inventoryItemId,
                itemName,
                quantityDeducted: quantity,
                unit,
                newQuantity
            });
        }

        return { success: errors.length === 0, deductions, errors };
    } catch (error: any) {
        errors.push(`Unexpected error: ${error.message}`);
        return { success: false, deductions, errors };
    }
}

/**
 * Deduct stock for a completed bar order.
 * Similar logic but uses bar_menu_items and bar_order_items.
 */
export async function deductStockForBarOrder(
    supabase: SupabaseClient,
    orderId: string,
    propertyId: string,
    performedBy?: string
): Promise<StockDeductionResult> {
    const deductions: StockDeductionResult['deductions'] = [];
    const errors: string[] = [];

    try {
        // 1. Fetch bar order items
        const { data: orderItems, error: orderError } = await supabase
            .from('bar_order_items')
            .select('bar_menu_item_id, quantity')
            .eq('order_id', orderId);

        if (orderError) {
            errors.push(`Failed to fetch bar order items: ${orderError.message}`);
            return { success: false, deductions, errors };
        }

        if (!orderItems || orderItems.length === 0) {
            return { success: true, deductions, errors };
        }

        // 2. Get unique bar menu item IDs
        const barMenuItemIds = Array.from(new Set(orderItems.map(i => i.bar_menu_item_id).filter(Boolean)));

        if (barMenuItemIds.length === 0) {
            return { success: true, deductions, errors };
        }

        // 3. Fetch recipes for bar items AND direct stock info
        // We fetch both: recipes mapping to inventory_items, AND bar_menu_items themselves if they track stock
        const { data: recipes, error: recipeError } = await supabase
            .from('menu_item_recipes')
            .select(`
        bar_menu_item_id,
        inventory_item_id,
        quantity_per_unit,
        inventory_items (id, name, quantity, unit)
      `)
            .in('bar_menu_item_id', barMenuItemIds)
            .eq('property_id', propertyId);

        if (recipeError) {
            errors.push(`Failed to fetch bar recipes: ${recipeError.message}`);
            // Don't return yet, we might have direct stock items
        }

        // Fetch bar menu items to check for direct stock tracking
        const { data: directItems, error: directStockError } = await supabase
            .from('bar_menu_items')
            .select('id, name, track_stock, stock_quantity, low_stock_threshold')
            .in('id', barMenuItemIds)
            .eq('track_stock', true);

        if (directStockError) {
             errors.push(`Failed to fetch direct stock items: ${directStockError.message}`);
        }

        // 4. Calculate deductions
        // We use a unified map for inventory items. 
        // For direct bar items, we treat them as their own "inventory item" for deduction purposes,
        // or handle them separately.
        // To keep it clean, let's handle "Inventory Items" (recipes) and "Direct Bar Items" separately.
        
        // A. Inventory Items (via Recipes)
        const deductionMap: Map<string, { quantity: number; itemName: string; unit: string }> = new Map();
        
        // B. Direct Bar Items
        const directDeductionMap: Map<string, { quantity: number; itemName: string }> = new Map();

        for (const orderItem of orderItems) {
            // Check for recipes first
            const itemRecipes = recipes?.filter(r => r.bar_menu_item_id === orderItem.bar_menu_item_id) || [];

            if (itemRecipes.length > 0) {
                for (const recipe of itemRecipes) {
                    const totalToDeduct = (recipe.quantity_per_unit || 1) * (orderItem.quantity || 1);
                    const invItem = recipe.inventory_items as any;
    
                    if (invItem) {
                        const existing = deductionMap.get(recipe.inventory_item_id) || {
                            quantity: 0,
                            itemName: invItem.name,
                            unit: invItem.unit || 'unit'
                        };
                        existing.quantity += totalToDeduct;
                        deductionMap.set(recipe.inventory_item_id, existing);
                    }
                }
            } else {
                // If no recipe, check if it's a direct stock item
                const directItem = directItems?.find(d => d.id === orderItem.bar_menu_item_id);
                if (directItem) {
                    const totalToDeduct = (orderItem.quantity || 1);
                    const existing = directDeductionMap.get(directItem.id) || {
                        quantity: 0,
                        itemName: directItem.name
                    };
                    existing.quantity += totalToDeduct;
                    directDeductionMap.set(directItem.id, existing);
                }
            }
        }

        // 5. Apply deductions (Inventory Items)
        for (const [inventoryItemId, { quantity, itemName, unit }] of Array.from(deductionMap)) {
            const { data: currentItem, error: fetchErr } = await supabase
                .from('inventory_items')
                .select('quantity')
                .eq('id', inventoryItemId)
                .single();

            if (fetchErr || !currentItem) {
                errors.push(`Failed to fetch inventory item ${itemName}: ${fetchErr?.message}`);
                continue;
            }

            const newQuantity = Math.max(0, (currentItem.quantity || 0) - quantity);

            const { error: updateErr } = await supabase
                .from('inventory_items')
                .update({
                    quantity: newQuantity,
                    updated_at: new Date().toISOString()
                })
                .eq('id', inventoryItemId);

            if (updateErr) {
                errors.push(`Failed to update ${itemName}: ${updateErr.message}`);
                continue;
            }

            const { error: txnErr } = await supabase
                .from('inventory_transactions')
                .insert({
                    item_id: inventoryItemId,
                    type: 'out',
                    quantity: -quantity,
                    reason: `Bar Order ${orderId.slice(0, 8)} completed`,
                    cost_at_time: null,
                    performed_by: performedBy || null
                });

            if (txnErr) {
                errors.push(`Failed to log transaction for ${itemName}: ${txnErr.message}`);
            }

            deductions.push({
                inventoryItemId,
                itemName,
                quantityDeducted: quantity,
                unit,
                newQuantity
            });
        }

        // 6. Apply deductions (Direct Bar Items)
        for (const [barItemId, { quantity, itemName }] of Array.from(directDeductionMap)) {
             // Fetch current again to be safe
             const { data: currentItem, error: fetchErr } = await supabase
                .from('bar_menu_items')
                .select('stock_quantity')
                .eq('id', barItemId)
                .single();
            
            if (fetchErr || !currentItem) {
                errors.push(`Failed to fetch bar item ${itemName}: ${fetchErr?.message}`);
                continue;
            }

            const newQuantity = Math.max(0, (currentItem.stock_quantity || 0) - quantity);

            const { error: updateErr } = await supabase
                .from('bar_menu_items')
                .update({
                    stock_quantity: newQuantity
                })
                .eq('id', barItemId);

            if (updateErr) {
                errors.push(`Failed to update stock for ${itemName}: ${updateErr.message}`);
                continue;
            }

            // We don't log to 'inventory_transactions' because that table links to 'inventory_items'.
            // Unless we want to create a separate transaction log for bar items, or make 'item_id' polymorphic.
            // For now, we just deduct. 
            // Ideally, we should unify them, but user requested "simple" tracking on bar table.
            
            deductions.push({
                inventoryItemId: barItemId, // Reusing field
                itemName,
                quantityDeducted: quantity,
                unit: 'unit',
                newQuantity
            });
        }

        return { success: errors.length === 0, deductions, errors };
    } catch (error: any) {
        errors.push(`Unexpected error: ${error.message}`);
        return { success: false, deductions, errors };
    }
}

/**
 * Take a stock snapshot for the beginning of day/week/month.
 */
export async function takeStockSnapshot(
    supabase: SupabaseClient,
    propertyId: string,
    snapshotType: 'daily' | 'weekly' | 'monthly',
    createdBy?: string,
    notes?: string
): Promise<{ success: boolean; snapshotId?: string; error?: string }> {
    try {
        // Fetch all inventory items for the property
        const { data: items, error: fetchErr } = await supabase
            .from('inventory_items')
            .select('id, name, quantity, unit, cost_per_unit')
            .eq('property_id', propertyId)
            .order('name');

        if (fetchErr) {
            return { success: false, error: `Failed to fetch inventory: ${fetchErr.message}` };
        }

        // Fetch tracked bar items
        const { data: barItems, error: barFetchErr } = await supabase
            .from('bar_menu_items')
            .select('id, name, stock_quantity, cost_price, bar_menu_item_properties!inner(property_id)')
            .eq('bar_menu_item_properties.property_id', propertyId)
            .eq('track_stock', true)
            .order('name');

        if (barFetchErr) {
             console.warn('Failed to fetch bar items for snapshot:', barFetchErr);
        }

        // Calculate total value (Inventory)
        let totalValue = (items || []).reduce((sum, item) => {
            return sum + ((item.quantity || 0) * (item.cost_per_unit || 0));
        }, 0);

        // Add Bar Items Value
        if (barItems) {
            totalValue += barItems.reduce((sum, item) => {
                return sum + ((item.stock_quantity || 0) * (item.cost_price || 0));
            }, 0);
        }

        // Format items for JSON storage
        const snapshotItems = [
            ...(items || []).map(item => ({
                item_id: item.id,
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                cost_per_unit: item.cost_per_unit,
                type: 'inventory'
            })),
            ...(barItems || []).map(item => ({
                item_id: item.id,
                name: item.name,
                quantity: item.stock_quantity,
                unit: 'unit',
                cost_per_unit: item.cost_price,
                type: 'bar'
            }))
        ];

        // Get today's date
        const today = new Date().toISOString().split('T')[0];

        // Upsert snapshot (update if already exists for today)
        const { data: snapshot, error: insertErr } = await supabase
            .from('stock_snapshots')
            .upsert({
                property_id: propertyId,
                snapshot_type: snapshotType,
                snapshot_date: today,
                items: snapshotItems,
                total_value: totalValue,
                notes: notes || `${snapshotType.charAt(0).toUpperCase() + snapshotType.slice(1)} opening stock`,
                created_by: createdBy || null
            }, {
                onConflict: 'property_id,snapshot_type,snapshot_date'
            })
            .select('id')
            .single();

        if (insertErr) {
            return { success: false, error: `Failed to save snapshot: ${insertErr.message}` };
        }

        return { success: true, snapshotId: snapshot?.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
