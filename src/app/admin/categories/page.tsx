import React from 'react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Plus, Layers, ChevronRight, Edit, Trash2 } from 'lucide-react';

async function CategoryTree({ parentId, level }: { parentId?: string; level: number }) {
  const categories = await db.category.findMany({
    where: { parentId: parentId || null, status: 'ACTIVE' },
    include: {
      translations: { where: { locale: 'uz' } },
      children: {
        include: { translations: { where: { locale: 'uz' } } },
      },
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  if (categories.length === 0) return null;

  return (
    <div className={level > 0 ? 'ml-6 mt-2 border-l border-brand-border pl-4' : 'space-y-2'}>
      {categories.map((cat) => (
        <div key={cat.id}>
          <div className="flex items-center justify-between p-3 bg-brand-dark/50 rounded-lg hover:bg-brand-dark/70 transition-colors">
            <div className="flex items-center gap-3">
              <Layers className={`w-4 h-4 ${level === 0 ? 'text-purple-400' : 'text-gray-500'}`} />
              <div>
                <p className="font-medium text-white text-sm">
                  {cat.translations[0]?.name || 'N/A'}
                </p>
                <p className="text-[10px] text-gray-500 font-mono">
                  {cat._count.products} mahsulot
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/categories/${cat.id}/edit`}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/admin/categories/create?parentId=${cat.id}`}
                className="text-[10px] text-brand-red hover:underline"
              >
                + Ost-kategoriya
              </Link>
            </div>
          </div>
          {cat.children && cat.children.length > 0 && (
            <CategoryTree parentId={cat.id} level={level + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

export default async function AdminCategoriesPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const totalCategories = await db.category.count({ where: { status: 'ACTIVE' } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Kategoriyalar</h1>
          <p className="text-xs text-gray-400 mt-1">Mahsulot kategoriyalari daraxti ({totalCategories} ta)</p>
        </div>

        <Link href="/admin/categories/create">
          <Button className="gap-2 font-bold">
            <Plus className="w-4 h-4" />
            <span>Yangi Kategoriya</span>
          </Button>
        </Link>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
        <CategoryTree parentId={undefined} level={0} />
      </div>
    </div>
  );
}
