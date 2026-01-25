/**
 * Stock Snapshot API
 * 
 * POST /api/mobile/manager/stock/snapshot
 * Takes a snapshot of current inventory state (beginning of day/week/month).
 * 
 * GET /api/mobile/manager/stock/snapshot?propertyId=xxx
 * Lists snapshots for a property with optional filters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { takeStockSnapshot } from '@/lib/stock/stock-deduction';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            propertyId,
            snapshotType = 'daily', // 'daily', 'weekly', 'monthly'
            notes
        } = body;

        if (!propertyId) {
            return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
        }

        if (!['daily', 'weekly', 'monthly'].includes(snapshotType)) {
            return NextResponse.json({
                error: 'Invalid snapshotType. Must be: daily, weekly, or monthly'
            }, { status: 400 });
        }

        // Verify auth
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabase = getSupabaseAdmin();

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Verify user has manager role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, property_id')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'manager', 'owner', 'super_admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Take the snapshot using our utility function
        const result = await takeStockSnapshot(
            supabase,
            propertyId,
            snapshotType as 'daily' | 'weekly' | 'monthly',
            user.id,
            notes
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            snapshot_id: result.snapshotId,
            message: `${snapshotType.charAt(0).toUpperCase() + snapshotType.slice(1)} snapshot created successfully`,
            snapshot_date: new Date().toISOString().split('T')[0]
        });

    } catch (error: any) {
        console.error('Snapshot creation error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        const snapshotType = searchParams.get('type'); // 'daily', 'weekly', 'monthly'
        const startDate = searchParams.get('startDate'); // YYYY-MM-DD
        const endDate = searchParams.get('endDate'); // YYYY-MM-DD
        const limit = parseInt(searchParams.get('limit') || '30');

        if (!propertyId) {
            return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
        }

        // Verify auth
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabase = getSupabaseAdmin();

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Build query
        let query = supabase
            .from('stock_snapshots')
            .select('*')
            .eq('property_id', propertyId)
            .order('snapshot_date', { ascending: false })
            .limit(limit);

        if (snapshotType && ['daily', 'weekly', 'monthly'].includes(snapshotType)) {
            query = query.eq('snapshot_type', snapshotType);
        }

        if (startDate) {
            query = query.gte('snapshot_date', startDate);
        }

        if (endDate) {
            query = query.lte('snapshot_date', endDate);
        }

        const { data: snapshots, error } = await query;

        if (error) {
            console.error('Snapshots fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Format response
        const formattedSnapshots = (snapshots || []).map(snap => ({
            id: snap.id,
            snapshot_type: snap.snapshot_type,
            snapshot_date: snap.snapshot_date,
            total_value: snap.total_value,
            item_count: Array.isArray(snap.items) ? snap.items.length : 0,
            notes: snap.notes,
            created_at: snap.created_at
        }));

        return NextResponse.json({
            success: true,
            snapshots: formattedSnapshots
        });

    } catch (error: any) {
        console.error('Snapshots GET error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}
