import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import {
  getAttributeById,
  updateAttribute,
  deleteAttribute,
} from '@/lib/services/attributeService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const attribute = await getAttributeById(id);
    if (!attribute) {
      return NextResponse.json({ error: 'Atribut topilmadi' }, { status: 404 });
    }
    return NextResponse.json({ attribute });
  } catch (error) {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const attribute = await updateAttribute(id, body);
    return NextResponse.json({ success: true, attribute });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server xatosi' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteAttribute(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server xatosi' }, { status: 400 });
  }
}
