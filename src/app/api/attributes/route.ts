import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getAllAttributes, createAttribute } from '@/lib/services/attributeService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'uz';

  try {
    const attributes = await getAllAttributes(locale);
    return NextResponse.json({ attributes });
  } catch (error) {
    return NextResponse.json({ error: 'Atributlarni yuklashda xatolik' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { code, type, unit, filterable, searchable, variantAxis, sortOrder, translations, options } = body;

    if (!code || !translations || translations.length === 0) {
      return NextResponse.json({ error: 'Kod va tarjimalar talab qilinadi' }, { status: 400 });
    }

    const attribute = await createAttribute({
      code,
      type,
      unit,
      filterable,
      searchable,
      variantAxis,
      sortOrder,
      translations,
      options,
    });

    return NextResponse.json({ success: true, attribute });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server xatosi' }, { status: 500 });
  }
}
