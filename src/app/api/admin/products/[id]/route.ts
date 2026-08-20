import { NextResponse } from 'next/server';
import { getAdminSession, createAuditLog } from '@/lib/auth';
import { getProductById, updateProduct, archiveProduct, deleteProduct } from '@/lib/services/productService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: 'Mahsulot topilmadi' }, { status: 404 });
    }
    return NextResponse.json({ product });
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
    const product = await updateProduct(id, body);
    await createAuditLog(session.adminId, 'PRODUCT_UPDATE', 'Product', id, { sku: product.sku });
    return NextResponse.json({ success: true, product });
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
    await deleteProduct(id);
    await createAuditLog(session.adminId, 'PRODUCT_DELETE', 'Product', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server xatosi' }, { status: 400 });
  }
}
