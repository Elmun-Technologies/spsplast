import { NextResponse } from 'next/server';
import { getAdminSession, createAuditLog } from '@/lib/auth';
import {
  getProductsAdmin,
  getProductById,
  updateProduct,
  archiveProduct,
  deleteProduct,
} from '@/lib/services/productService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'uz';
  const search = searchParams.get('search') || undefined;
  const status = searchParams.get('status') || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;
  const isBestseller = searchParams.get('isBestseller') === 'true' ? true : undefined;
  const isNew = searchParams.get('isNew') === 'true' ? true : undefined;
  const sortBy = searchParams.get('sortBy') || undefined;
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  try {
    const result = await getProductsAdmin({
      search,
      status,
      categoryId,
      isBestseller,
      isNew,
      sortBy,
      sortOrder,
      page,
      pageSize,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Mahsulotlarni yuklashda xatolik' }, { status: 500 });
  }
}
