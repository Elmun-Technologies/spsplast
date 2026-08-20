'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Edit, Archive } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice: number | null;
  status: string;
  inStock: boolean;
  stockQty: number;
  isBestseller: boolean;
  isNew: boolean;
  categories: Array<{ id: string; name: string }>;
  thumbnail: string | null;
  variantCount: number;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function ProductsList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pageSize: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?locale=uz');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Kategoriyalarni yuklashda xatolik:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status !== 'ALL') params.set('status', status);
      if (selectedCategory) params.set('categoryId', selectedCategory);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', searchParams.get('page') || '1');
      params.set('pageSize', '20');

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { total: 0, page: 1, pageSize: 20, totalPages: 0 });
    } catch (error) {
      console.error('Mahsulotlarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status !== 'ALL') params.set('status', status);
    if (selectedCategory) params.set('categoryId', selectedCategory);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    router.push(`/admin/products?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/admin/products?${params.toString()}`);
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Mahsulotni arxivlamoqchimisiz?')) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      alert('Xatolik yuz berdi');
    }
  };

  const getStatusBadge = (s: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-emerald-500/20 text-emerald-400',
      DRAFT: 'bg-amber-500/20 text-amber-400',
      ARCHIVED: 'bg-gray-500/20 text-gray-400',
    };
    const labels: Record<string, string> = {
      ACTIVE: 'Faol',
      DRAFT: 'Qoralama',
      ARCHIVED: 'Arxiv',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${styles[s] || styles.DRAFT}`}>
        {labels[s] || s}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Mahsulotlar</h1>
          <p className="text-xs text-gray-400 mt-1">Jami: {pagination.total} ta mahsulot</p>
        </div>

        <Link href="/admin/products/create">
          <Button className="gap-2 font-bold">
            <Plus className="w-4 h-4" />
            <span>Yangi Mahsulot</span>
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="bg-brand-card border border-brand-border rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full bg-brand-dark border border-brand-border rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
          >
            <option value="ALL">Barcha statuslar</option>
            <option value="ACTIVE">Faol</option>
            <option value="DRAFT">Qoralama</option>
            <option value="ARCHIVED">Arxiv</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
          >
            <option value="">Barcha kategoriyalar</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <Button type="submit" className="gap-2">
            <Filter className="w-4 h-4" />
            <span>Saralash</span>
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400 text-sm">Yuklanmoqda...</div>
        </div>
      ) : (
        <>
          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-brand-dark text-gray-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-4">Rasm</th>
                    <th className="p-4">Nomi & SKU</th>
                    <th className="p-4">Kategoriyalar</th>
                    <th className="p-4">Narxi</th>
                    <th className="p-4">Zaxira</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5">
                      <td className="p-4">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-brand-border">
                          {p.thumbnail ? (
                            <Image src={p.thumbnail} alt={p.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-brand-dark flex items-center justify-center text-[10px] text-gray-500">
                              No Img
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-white text-sm">{p.name}</p>
                        <p className="font-mono text-[10px] text-gray-400">SKU: {p.sku}</p>
                        {p.variantCount > 0 && (
                          <p className="text-[10px] text-purple-400">{p.variantCount} variant</p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {p.categories.map((c) => (
                            <span key={c.id} className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-extrabold text-white">{formatPrice(p.basePrice, 'uz')}</p>
                        {p.compareAtPrice && (
                          <p className="text-[10px] text-gray-500 line-through">{formatPrice(p.compareAtPrice, 'uz')}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`font-mono font-bold ${p.inStock ? 'text-emerald-400' : 'text-red-400'}`}>
                          {p.stockQty}
                        </span>
                      </td>
                      <td className="p-4">{getStatusBadge(p.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          {p.status !== 'ARCHIVED' && (
                            <button
                              onClick={() => handleArchive(p.id)}
                              className="p-1.5 text-gray-400 hover:text-amber-400 transition-colors"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-gray-400">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-sm">Yuklanmoqda...</div>}>
      <ProductsList />
    </Suspense>
  );
}
