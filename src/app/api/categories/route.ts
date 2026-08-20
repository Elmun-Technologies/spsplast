import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import {
  getAllCategories,
  createCategory,
  getCategoryTree,
} from '@/lib/services/categoryService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'uz';
  const tree = searchParams.get('tree') === 'true';

  try {
    if (tree) {
      const categories = await getCategoryTree(locale);
      return NextResponse.json({ categories });
    }
    const categories = await getAllCategories(locale);
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: 'Kategoriyalarni yuklashda xatolik' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { parentId, image, sortOrder, translations } = body;

    if (!translations || translations.length === 0) {
      return NextResponse.json({ error: 'Tarjimalar talab qilinadi' }, { status: 400 });
    }

    const category = await createCategory({
      parentId: parentId || undefined,
      image,
      sortOrder,
      translations,
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server xatosi' }, { status: 500 });
  }
}
