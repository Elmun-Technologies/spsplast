import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { updateOrderStatusServerSide } from '@/lib/services/orderService';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { status, note } = body;

        if (!status) {
            return NextResponse.json({ error: 'Status point qilinmagan' }, { status: 400 });
        }

        const updatedOrder = await updateOrderStatusServerSide(
            params.id,
            status,
            session.id,
            note
        );

        return NextResponse.json({ success: true, order: updatedOrder });
    } catch (error: any) {
        console.error('Error updating order status:', error);
        return NextResponse.json(
            { error: error.message || 'Server error' },
            { status: 400 }
        );
    }
}
