'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Plus, X, Image as ImageIcon, Layers, Tag, Box, Settings } from 'lucide-react';

interface ProductData {
  id: string;
  sku: string;
  status: string;
  basePrice: number;
  compareAtPrice: number | null;
  stockQty: number;
  inStock: boolean;
  trackInventory: boolean;
  allowBackorder: boolean;
  isBestseller: boolean;
  isNew: boolean;
  yieldPerCast: number | null;
  durabilityCasts: number | null;
  videoUrl: string | null;
  translations: Array<{
    locale: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    description: string | null;
  }>;
  categories: Array<{ categoryId: string; category: { id: string; translations: any[] } }>;
  attributeValues: Array<{
    id: string;
    attributeId: string;
    textValue: string | null;
    numberValue: number | null;
    booleanValue: boolean | null;
    optionId: string | null;
    attribute: { code: string; translations: any[]; type: string; options: any[] };
  }>;
  media: Array<{
    id: string;
    type: string;
    url: string;
    alt: string | null;
    sortOrder: number;
  }>;
  variants: Array<any>;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'categories' | 'specs' | 'variants' | 'media'>('info');

  const [sku, setSku] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [basePrice, setBasePrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stockQty, setStockQty] = useState('100');
  const [inStock, setInStock] = useState(true);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [yieldPerCast, setYieldPerCast] = useState('');
  const [durabilityCasts, setDurabilityCasts] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const [nameUz, setNameUz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [descriptionUz, setDescriptionUz] = useState('');
  const [descriptionRu, setDescriptionRu] = useState('');
  const [shortDescUz, setShortDescUz] = useState('');
  const [shortDescRu, setShortDescRu] = useState('');

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [attributes, setAttributes] = useState<any[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({});

  const [media, setMedia] = useState<Array<{ id?: string; type: string; url: string; alt: string }>>([]);
  const [newMediaType, setNewMediaType] = useState('GALLERY');
  const [newMediaUrl, setNewMediaUrl] = useState('');

  const [variants, setVariants] = useState<any[]>([]);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
    fetchAttributes();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const p: ProductData = data.product;
      setSku(p.sku);
      setStatus(p.status);
      setBasePrice(p.basePrice.toString());
      setCompareAtPrice(p.compareAtPrice?.toString() || '');
      setStockQty(p.stockQty.toString());
      setInStock(p.inStock);
      setIsBestseller(p.isBestseller);
      setIsNew(p.isNew);
      setYieldPerCast(p.yieldPerCast?.toString() || '');
      setDurabilityCasts(p.durabilityCasts?.toString() || '');
      setVideoUrl(p.videoUrl || '');

      const transUz = p.translations.find((t) => t.locale === 'uz');
      const transRu = p.translations.find((t) => t.locale === 'ru');
      setNameUz(transUz?.name || '');
      setNameRu(transRu?.name || '');
      setDescriptionUz(transUz?.description || '');
      setDescriptionRu(transRu?.description || '');
      setShortDescUz(transUz?.shortDescription || '');
      setShortDescRu(transRu?.shortDescription || '');

      setSelectedCategories(p.categories.map((c) => c.categoryId));

      const attrVals: Record<string, any> = {};
      p.attributeValues.forEach((av) => {
        const attrCode = av.attribute.code;
        if (av.attribute.type === 'SELECT' || av.attribute.type === 'MULTISELECT') {
          attrVals[attrCode] = av.optionId;
        } else if (av.attribute.type === 'NUMBER') {
          attrVals[attrCode] = av.numberValue?.toString() || '';
        } else if (av.attribute.type === 'BOOLEAN') {
          attrVals[attrCode] = av.booleanValue || false;
        } else {
          attrVals[attrCode] = av.textValue || '';
        }
      });
      setAttributeValues(attrVals);

      setMedia(p.media.map((m) => ({ id: m.id, type: m.type, url: m.url, alt: m.alt || '' })));
      setVariants(p.variants || []);
    } catch (error: any) {
      setError(error.message || 'Mahsulotni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?locale=uz');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Kategoriyalarni yuklashda xatolik:', error);
    }
  };

  const fetchAttributes = async () => {
    try {
      const res = await fetch('/api/attributes?locale=uz');
      const data = await res.json();
      setAttributes(data.attributes || []);
    } catch (error) {
      console.error('Atributlarni yuklashda xatolik:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const slugUz = nameUz.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slugRu = (nameRu || nameUz).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const attrValuesArray = Object.entries(attributeValues)
        .map(([code, value]) => {
          const attr = attributes.find((a) => a.code === code);
          if (!attr || value === '' || value === null || value === undefined) return null;

          const result: any = { attributeId: attr.id };

          if (attr.type === 'SELECT' || attr.type === 'MULTISELECT') {
            result.optionId = value;
          } else if (attr.type === 'NUMBER') {
            result.numberValue = parseFloat(value as string);
          } else if (attr.type === 'BOOLEAN') {
            result.booleanValue = value;
          } else {
            result.textValue = value;
          }

          return result;
        })
        .filter(Boolean);

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku,
          status,
          basePrice: parseInt(basePrice),
          compareAtPrice: compareAtPrice ? parseInt(compareAtPrice) : null,
          stockQty: parseInt(stockQty),
          inStock,
          isBestseller,
          isNew,
          yieldPerCast: yieldPerCast ? parseInt(yieldPerCast) : null,
          durabilityCasts: durabilityCasts ? parseInt(durabilityCasts) : null,
          videoUrl: videoUrl || null,
          translations: [
            {
              locale: 'uz',
              name: nameUz,
              slug: slugUz,
              shortDescription: shortDescUz || null,
              description: descriptionUz || null,
            },
            {
              locale: 'ru',
              name: nameRu || nameUz,
              slug: slugRu,
              shortDescription: shortDescRu || shortDescUz || null,
              description: descriptionRu || descriptionUz || null,
            },
          ],
          categories: selectedCategories,
          attributeValues: attrValuesArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push('/admin/products');
    } catch (error: any) {
      setError(error.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const addMedia = () => {
    if (!newMediaUrl) return;
    setMedia([...media, { type: newMediaType, url: newMediaUrl, alt: '' }]);
    setNewMediaUrl('');
  };

  const removeMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Yuklanmoqda...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Asosiy', icon: <Settings className="w-4 h-4" /> },
    { id: 'categories', label: 'Kategoriyalar', icon: <Layers className="w-4 h-4" /> },
    { id: 'specs', label: 'Xususiyatlar', icon: <Tag className="w-4 h-4" /> },
    { id: 'variants', label: 'Variantlar', icon: <Box className="w-4 h-4" /> },
    { id: 'media', label: 'Rasmlar', icon: <ImageIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-xs text-brand-red font-bold">
        <ArrowLeft className="w-4 h-4" />
        <span>Mahsulotlarga qaytish</span>
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white">Mahsulotni Tahrirlash</h1>
        <Button onClick={handleSave} isLoading={saving} className="gap-2 font-bold">
          <Save className="w-4 h-4" />
          <span>Saqlash</span>
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold">
          {error}
        </div>
      )}

      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
        <div className="flex border-b border-brand-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-brand-red border-b-2 border-brand-red bg-brand-dark/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Nomi (O'zbekcha) *</label>
                  <input
                    type="text"
                    value={nameUz}
                    onChange={(e) => setNameUz(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Nomi (Ruscha)</label>
                  <input
                    type="text"
                    value={nameRu}
                    onChange={(e) => setNameRu(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">SKU *</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                  >
                    <option value="DRAFT">Qoralama</option>
                    <option value="ACTIVE">Faol</option>
                    <option value="ARCHIVED">Arxiv</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Zaxira</label>
                  <input
                    type="number"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Narxi (So'm) *</label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Eski narxi</label>
                  <input
                    type="number"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Bir quyishda mahsulot soni</label>
                  <input
                    type="number"
                    value={yieldPerCast}
                    onChange={(e) => setYieldPerCast(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Resurs (quyishlar soni)</label>
                  <input
                    type="number"
                    value={durabilityCasts}
                    onChange={(e) => setDurabilityCasts(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-4 h-4 rounded border-brand-border bg-brand-dark text-brand-red focus:ring-brand-red"
                  />
                  <span className="text-xs text-gray-300">Sotuvda mavjud</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestseller}
                    onChange={(e) => setIsBestseller(e.target.checked)}
                    className="w-4 h-4 rounded border-brand-border bg-brand-dark text-brand-red focus:ring-brand-red"
                  />
                  <span className="text-xs text-gray-300">Bestseller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                    className="w-4 h-4 rounded border-brand-border bg-brand-dark text-brand-red focus:ring-brand-red"
                  />
                  <span className="text-xs text-gray-300">Yangi</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Qisqa tavsif (O'zbekcha)</label>
                <textarea
                  rows={2}
                  value={shortDescUz}
                  onChange={(e) => setShortDescUz(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Tavsif (O'zbekcha)</label>
                <textarea
                  rows={4}
                  value={descriptionUz}
                  onChange={(e) => setDescriptionUz(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Tavsif (Ruscha)</label>
                <textarea
                  rows={4}
                  value={descriptionRu}
                  onChange={(e) => setDescriptionRu(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">Mahsulot kategoriyalarini tanlang</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCategories.includes(cat.id)
                        ? 'bg-brand-red/20 border-brand-red text-white'
                        : 'bg-brand-dark border-brand-border text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, cat.id]);
                        } else {
                          setSelectedCategories(selectedCategories.filter((id) => id !== cat.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-brand-border bg-brand-dark text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">Mahsulot xususiyatlari</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {attributes.map((attr) => {
                  const transUz = attr.translations?.find((t: any) => t.locale === 'uz');
                  const name = transUz?.name || attr.code;

                  return (
                    <div key={attr.id}>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        {name}
                        {attr.unit && <span className="text-gray-500"> ({attr.unit})</span>}
                      </label>

                      {attr.type === 'SELECT' || attr.type === 'MULTISELECT' ? (
                        <select
                          value={attributeValues[attr.code] || ''}
                          onChange={(e) =>
                            setAttributeValues({ ...attributeValues, [attr.code]: e.target.value })
                          }
                          className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                        >
                          <option value="">Tanlang...</option>
                          {attr.options?.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.translations?.find((t: any) => t.locale === 'uz')?.label || opt.code}
                            </option>
                          ))}
                        </select>
                      ) : attr.type === 'BOOLEAN' ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attributeValues[attr.code] || false}
                            onChange={(e) =>
                              setAttributeValues({ ...attributeValues, [attr.code]: e.target.checked })
                            }
                            className="w-4 h-4 rounded border-brand-border bg-brand-dark text-brand-red focus:ring-brand-red"
                          />
                          <span className="text-sm text-gray-300">Ha</span>
                        </label>
                      ) : attr.type === 'NUMBER' ? (
                        <input
                          type="number"
                          value={attributeValues[attr.code] || ''}
                          onChange={(e) =>
                            setAttributeValues({ ...attributeValues, [attr.code]: e.target.value })
                          }
                          className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                        />
                      ) : (
                        <input
                          type="text"
                          value={attributeValues[attr.code] || ''}
                          onChange={(e) =>
                            setAttributeValues({ ...attributeValues, [attr.code]: e.target.value })
                          }
                          className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Mahsulot variantlari ({variants.length} ta)</p>
                <Link href={`/admin/products/${productId}/variants/create`}>
                  <Button size="sm" variant="ghost" className="gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yangi variant</span>
                  </Button>
                </Link>
              </div>

              {variants.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">
                  Variantlar mavjud emas
                </div>
              ) : (
                <div className="space-y-2">
                  {variants.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-brand-dark rounded-lg">
                      <div>
                        <p className="font-mono text-sm text-white">{v.sku}</p>
                        <p className="text-[10px] text-gray-400">{v.price} So'm</p>
                      </div>
                      <Link href={`/admin/products/${productId}/variants/${v.id}/edit`}>
                        <Button size="sm" variant="ghost">Tahrirlash</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">Mahsulot rasmlari va videolari</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newMediaType}
                  onChange={(e) => setNewMediaType(e.target.value)}
                  className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                >
                  <option value="MAIN">Asosiy rasm</option>
                  <option value="MOLD">Qolip rasmi</option>
                  <option value="FINISHED_RESULT">Tayyor mahsulot</option>
                  <option value="GALLERY">Galereya</option>
                  <option value="DETAIL">Detal</option>
                  <option value="VIDEO">Video</option>
                </select>
                <input
                  type="text"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  placeholder="Rasm URL"
                  className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                />
                <Button type="button" onClick={addMedia} variant="ghost" className="gap-1">
                  <Plus className="w-4 h-4" />
                  <span>Qo'shish</span>
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {media.map((m, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-brand-dark border border-brand-border">
                      <img src={m.url} alt={m.alt || ''} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] bg-black/70 text-white">
                      {m.type}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1 right-1 p-1 rounded bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
