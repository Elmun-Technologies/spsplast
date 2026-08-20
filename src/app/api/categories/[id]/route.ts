import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '@/lib/services/categoryService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'uz';

  try {
    const category = await getCategoryById(id, locale);
    if (!category) {
      return NextResponse.json({ error: 'Kategoriya topilmadi' }, { status: 404 });
    }
    return NextResponse.json({ category });
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
    const category = await updateCategory(id, body);
    return NextResponse.json({ success: true, category });
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
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server xatosi' }, { status: 400 });
  }
}
