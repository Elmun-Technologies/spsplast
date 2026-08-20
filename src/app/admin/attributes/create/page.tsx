'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import Link from 'next/link';

interface OptionInput {
  code: string;
  labelUz: string;
  labelRu: string;
}

export default function CreateAttributePage() {
  const router = useRouter();

  const [code, setCode] = useState('');
  const [nameUz, setNameUz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [type, setType] = useState('TEXT');
  const [unit, setUnit] = useState('');
  const [filterable, setFilterable] = useState(true);
  const [searchable, setSearchable] = useState(true);
  const [variantAxis, setVariantAxis] = useState(false);
  const [options, setOptions] = useState<OptionInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => {
    setOptions([...options, { code: '', labelUz: '', labelRu: '' }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof OptionInput, value: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
          type,
          unit: unit || null,
          filterable,
          searchable,
          variantAxis,
          translations: [
            { locale: 'uz', name: nameUz },
            { locale: 'ru', name: nameRu || nameUz },
          ],
          options: options
            .filter((o) => o.code && o.labelUz)
            .map((o) => ({
              code: o.code.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
              translations: [
                { locale: 'uz', label: o.labelUz },
                { locale: 'ru', label: o.labelRu || o.labelUz },
              ],
            })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin/attributes');
      } else {
        setError(data.error || 'Atribut yaratishda xatolik');
      }
    } catch (err) {
      console.error(err);
      setError('Server xatosi');
    } finally {
      setLoading(false);
    }
  };

  const needsOptions = type === 'SELECT' || type === 'MULTISELECT';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/admin/attributes" className="inline-flex items-center gap-1.5 text-xs text-brand-red font-bold">
        <ArrowLeft className="w-4 h-4" />
        <span>Atributlarga qaytish</span>
      </Link>

      <h1 className="text-3xl font-black text-white">Yangi Atribut Yaratish</h1>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Kod (ma'niy) *</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
              placeholder="THICKNESS"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-brand-red"
            />
            <p className="text-[10px] text-gray-500 mt-1">Masalan: MATERIAL, COLOR, THICKNESS</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Turi *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            >
              <option value="TEXT">Matn</option>
              <option value="NUMBER">Raqam</option>
              <option value="BOOLEAN">Ha/Yo'q</option>
              <option value="SELECT">Tanlov (bitta)</option>
              <option value="MULTISELECT">Ko'p tanlov</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nomi (O'zbekcha) *</label>
            <input
              type="text"
              required
              value={nameUz}
              onChange={(e) => setNameUz(e.target.value)}
              placeholder="Qalinligi"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nomi (Ruscha)</label>
            <input
              type="text"
              value={nameRu}
              onChange={(e) => setNameRu(e.target.value)}
              placeholder="Толщина"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">O'lchov birligi</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="mm, kg, quyish"
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterable}
              onChange={(e) => setFilterable(e.target.checked)}
              className="w-4 h-4 rounded border-brand-border bg-brand-dark text-brand-red focus:ring-brand-red"
            />
            <span className="text-xs text-gray-300">Filterda ko'rsatish</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={searchable}
              onChange={(e) => setSearchable(e.target.checked)}
              className="w-4 h-4 rounded border-brand-border bg-brand-dark text-brand-red focus:ring-brand-red"
            />
            <span className="text-xs text-gray-300">Qidirishda ishlatish</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={variantAxis}
              onChange={(e) => setVariantAxis(e.target.checked)}
              className="w-4 h-4 rounded border-brand-border bg-brand-dark text-brand-red focus:ring-brand-red"
            />
            <span className="text-xs text-gray-300">Variant o'qi (variant yaratish uchun)</span>
          </label>
        </div>

        {needsOptions && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300">Variantlar</label>
              <Button type="button" size="sm" variant="ghost" onClick={addOption} className="gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Qo'shish</span>
              </Button>
            </div>

            {options.length === 0 && (
              <p className="text-[10px] text-gray-500">Tanlov turi uchun variantlar kerak</p>
            )}

            {options.map((opt, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="kod"
                  value={opt.code}
                  onChange={(e) => updateOption(idx, 'code', e.target.value)}
                  className="col-span-2 bg-brand-dark border border-brand-border rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-brand-red"
                />
                <input
                  type="text"
                  placeholder="O'zbekcha"
                  value={opt.labelUz}
                  onChange={(e) => updateOption(idx, 'labelUz', e.target.value)}
                  className="col-span-4 bg-brand-dark border border-brand-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red"
                />
                <input
                  type="text"
                  placeholder="Ruscha"
                  value={opt.labelRu}
                  onChange={(e) => updateOption(idx, 'labelRu', e.target.value)}
                  className="col-span-5 bg-brand-dark border border-brand-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red"
                />
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  className="col-span-1 p-1 text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button type="submit" isLoading={loading} size="lg" className="w-full gap-2 font-bold">
          <Save className="w-4 h-4" />
          <span>Atributni Saqlash</span>
        </Button>
      </form>
    </div>
  );
}
