import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { verifyManagerAccess } from '../../utils';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        const userId = params.id;

        if (!propertyId) return NextResponse.json({ error: 'Property ID required' }, { status: 400 });

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();

        // Verify target user belongs to this property (security check)
        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('property_id')
            .eq('id', userId)
            .single();

        if (!targetProfile || targetProfile.property_id !== propertyId) {
            return NextResponse.json({ error: 'User not found in this property' }, { status: 404 });
        }

        // Delete Auth User (Cascades to profile usually, or manual delete)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { propertyId, firstName, lastName, role, phone } = body;
        const userId = params.id;

        if (!propertyId) return NextResponse.json({ error: 'Property ID required' }, { status: 400 });

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();

        // Verify target user belongs to this property
        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('property_id')
            .eq('id', userId)
            .single();

        if (!targetProfile || targetProfile.property_id !== propertyId) {
            return NextResponse.json({ error: 'User not found in this property' }, { status: 404 });
        }

        const updates: any = {};
        if (firstName !== undefined) updates.first_name = firstName;
        if (lastName !== undefined) updates.last_name = lastName;
        if (role !== undefined) updates.role = role;
        if (phone !== undefined) updates.phone = phone;

        const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (updateError) throw updateError;

        // Optionally update Auth Metadata if name changed
        if (firstName || lastName) {
             await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { first_name: firstName, last_name: lastName }
             });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
