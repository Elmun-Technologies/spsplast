'use client';

import { startTransition, useActionState, useMemo, useState, useTransition } from 'react';
import type { ProductImages, ProductMold, ProductSpec, ProductStatus, ProductTile, LocalizedText } from '@/server/db/schema';
import { saveProductAction, uploadImageAction, type ProductFormState } from '../actions';
import { PRODUCT_STATUS_LABEL } from '../labels';

type Section = { key: string; name: LocalizedText };

export type ProductDraft = {
  status: ProductStatus;
  section: string;
  code: string | null;
  slug: string;
  sort: number;
  name: LocalizedText;
  subtitle: LocalizedText;
  note: LocalizedText;
  kg: string | null;
  sizeEstimated: boolean;
  molds: ProductMold[];
  tiles: ProductTile[];
  specs: ProductSpec[];
  images: ProductImages;
};

const LANGS = [
  { k: 'uz', label: "O'zbekcha" },
  { k: 'ru', label: 'Ruscha' },
  { k: 'en', label: 'Inglizcha' },
] as const;
const LETTERS = ['A', 'B', 'C'];

function LocalizedInputs({
  label,
  value,
  onChange,
  required,
  hint,
}: {
  label: string;
  value: LocalizedText;
  onChange: (v: LocalizedText) => void;
  required?: boolean;
  hint?: string;
}) {
  return (
    <fieldset className="adm-loc">
      <legend>
        {label}
        {hint ? <small> — {hint}</small> : null}
      </legend>
      {LANGS.map((l) => (
        <label key={l.k}>
          <span>
            {l.k.toUpperCase()}
            {required && l.k === 'uz' ? ' *' : ''}
          </span>
          <input
            className="sps-input"
            value={value[l.k] ?? ''}
            required={required && l.k === 'uz'}
            onChange={(e) => onChange({ ...value, [l.k]: e.target.value || null })}
            aria-label={`${label} (${l.label})`}
          />
        </label>
      ))}
    </fieldset>
  );
}

function ImageSlot({
  title,
  hint,
  url,
  role,
  onChange,
}: {
  title: string;
  hint: string;
  url: string | null;
  role: 'scene' | 'mold' | 'tile';
  onChange: (url: string | null, smUrl?: string | null) => void;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ error?: string; warnings?: string[] } | null>(null);
  const [trim, setTrim] = useState(true);
  // Qolip/mahsulot suratlarida fon standart holatda AI bilan olib tashlanadi (sahnada emas).
  const [ai, setAi] = useState(role !== 'scene');
  const [aiBusy, setAiBusy] = useState(false);
  const [candidate, setCandidate] = useState<{ original: File; cut: File; preview: string } | null>(null);

  const upload = (file: File) => {
    const fd = new FormData();
    fd.set('file', file);
    fd.set('role', role);
    fd.set('trim', trim ? '1' : '0');
    start(async () => {
      const res = await uploadImageAction(fd);
      if (res.error) setMsg({ error: res.error });
      else {
        setMsg(res.warnings?.length ? { warnings: res.warnings } : null);
        onChange(res.url ?? null, res.smUrl ?? null);
      }
    });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setMsg(null);
    if (!ai) return upload(file);
    setAiBusy(true);
    try {
      const { removeBackground } = await import('./removeBackground');
      const { blob, preview } = await removeBackground(file);
      const name = file.name.replace(/\.[^.]+$/, '') + '-fonsiz.png';
      setCandidate({ original: file, cut: new File([blob], name, { type: 'image/png' }), preview });
    } catch (error) {
      setMsg({ error: `Fonni olib tashlab bo'lmadi (${error instanceof Error ? error.message : 'xato'}). Asl rasm yuklanmoqda.` });
      upload(file);
    } finally {
      setAiBusy(false);
    }
  };

  const choose = (which: 'cut' | 'original') => {
    if (!candidate) return;
    URL.revokeObjectURL(candidate.preview);
    upload(which === 'cut' ? candidate.cut : candidate.original);
    setCandidate(null);
  };

  return (
    <div className={`adm-slot${url ? ' adm-slot--filled' : ''}`}>
      <div className="adm-slot__img">
        {candidate ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin oldindan ko'rish: AI natijasi
          <img src={candidate.preview} alt="" />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin oldindan ko'rish: xom WebP
          <img src={url} alt="" />
        ) : (
          <span>{aiBusy ? 'AI fonni olib tashlamoqda…' : pending ? 'Yuklanmoqda…' : "Rasm yo'q"}</span>
        )}
      </div>
      <div className="adm-slot__body">
        <b>{title}</b>
        <small>{hint}</small>
        {candidate ? (
          <div className="adm-slot__act">
            <small>Fon olib tashlandi — natija to'g'rimi?</small>
            <button type="button" className="sps-btn sps-btn--dark sps-btn--sm" onClick={() => choose('cut')}>
              Fonsizini saqlash
            </button>
            <button type="button" className="sps-btn sps-btn--outline sps-btn--sm" onClick={() => choose('original')}>
              Asl rasmni saqlash
            </button>
          </div>
        ) : (
          <div className="adm-slot__act">
            <label className="sps-btn sps-btn--outline sps-btn--sm" aria-disabled={pending || aiBusy}>
              {aiBusy ? 'AI ishlamoqda…' : url ? 'Almashtirish' : 'Yuklash'}
              <input
                type="file"
                accept="image/*"
                aria-label={`${title}: rasm yuklash`}
                hidden
                disabled={pending || aiBusy}
                onChange={(e) => {
                  void onFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            {url ? (
              <button type="button" className="sps-btn sps-btn--link sps-btn--sm" onClick={() => onChange(null, null)}>
                Olib tashlash
              </button>
            ) : null}
          </div>
        )}
        {role !== 'scene' ? (
          <>
            <label className="adm-check">
              <input type="checkbox" aria-label="Fonni AI bilan olib tashlash" checked={ai} onChange={(e) => setAi(e.target.checked)} /> Fonni AI bilan olib tashlash
            </label>
            <label className="adm-check">
              <input type="checkbox" aria-label="Chetdagi bo'sh fonni kesish" checked={trim} onChange={(e) => setTrim(e.target.checked)} /> Chetdagi bo&apos;sh fonni kesish
            </label>
          </>
        ) : null}
        {msg?.error ? <small className="adm-warn">{msg.error}</small> : null}
        {msg?.warnings?.map((w) => (
          <small key={w} className="adm-warn">
            {w}
          </small>
        ))}
      </div>
    </div>
  );
}

export function ProductForm({
  productId,
  initial,
  sections,
  liveUrl,
}: {
  productId: number | null;
  initial: ProductDraft;
  sections: Section[];
  liveUrl: string | null;
}) {
  const [p, setP] = useState<ProductDraft>(initial);
  const [state, action, saving] = useActionState<ProductFormState, FormData>(saveProductAction, undefined);
  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => setP((x) => ({ ...x, [k]: v }));
  const payload = useMemo(() => JSON.stringify(p), [p]);
  const isMold = p.molds.length > 0 || p.section === 'trotuar';

  const setImage = (kind: 'molds' | 'tiles', letter: string, url: string | null) =>
    setP((x) => {
      const next = { ...x.images[kind] };
      if (url) next[letter] = url;
      else delete next[letter];
      return { ...x, images: { ...x.images, [kind]: next } };
    });

  return (
    <form
      className="adm-pform"
      // `action={…}` emas: React 19 action'dan keyin formani reset qiladi va boshqariladigan
      // select'lar (bo'lim) DOM'da bo'sh qolib ketadi. Holat baribir `p` da.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="productId" value={productId ?? ''} />
      <input type="hidden" name="payload" value={payload} />

      <div className="adm-grid adm-grid--side">
        <div className="adm-grid">
          <section className="adm-card">
            <h2>Asosiy</h2>
            <div className="adm-row3">
              <label className="sps-field">
                <span>Kod</span>
                <input className="sps-input" aria-label="Kod" value={p.code ?? ''} onChange={(e) => set('code', e.target.value || null)} placeholder="70, F17, TP-001" />
              </label>
              <label className="sps-field">
                <span>Bo'lim *</span>
                <select className="sps-select" aria-label="Bo'lim" value={p.section} onChange={(e) => set('section', e.target.value)} required>
                  <option value="">— tanlang —</option>
                  {sections.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.name.uz}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sps-field">
                <span>Tartib (kichik — oldinda)</span>
                <input className="sps-input" aria-label="Tartib" type="number" min={0} value={p.sort} onChange={(e) => set('sort', Number(e.target.value) || 0)} />
              </label>
            </div>
            <LocalizedInputs label="Nomi" value={p.name} onChange={(v) => set('name', v)} required hint="ruscha nom kirill harflarida (Монако)" />
            <LocalizedInputs label="Qisqa tavsif" value={p.subtitle} onChange={(v) => set('subtitle', v)} />
            <LocalizedInputs label="Izoh (ixtiyoriy)" value={p.note} onChange={(v) => set('note', v)} />
            <label className="sps-field">
              <span>URL slug (bo'sh qolsa koddan va nomdan yasaladi)</span>
              <input className="sps-input" aria-label="URL slug" value={p.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} placeholder="01-monako" />
            </label>
          </section>

          <section className="adm-card">
            <h2>Rasmlar</h2>
            <p className="adm-empty" style={{ marginBottom: 12 }}>
              Qolip va plitka suratlari — fonni olib tashlangan (shaffof PNG) yoki toza oq fonda. Sahna — terilgan plitka /
              obyekt surati. Har qanday format avtomatik WebP'ga o'giriladi.
            </p>
            <div className="adm-slots">
              <ImageSlot
                title="Sahna (asosiy rasm)"
                hint="Terilgan ko'rinish, kartochka va galereyaning birinchi rasmi"
                url={p.images.scene}
                role="scene"
                onChange={(url, sm) => set('images', { ...p.images, scene: url, sceneSm: url ? (sm ?? null) : null })}
              />
              {LETTERS.slice(0, Math.max(1, p.molds.length)).map((l) => (
                <ImageSlot
                  key={`m${l}`}
                  title={`Qolip ${l}`}
                  hint="Qolipning o'zi (haqiqiy surat)"
                  url={p.images.molds[l] ?? null}
                  role="mold"
                  onChange={(url) => setImage('molds', l, url)}
                />
              ))}
              {LETTERS.slice(0, Math.max(1, p.tiles.length)).map((l) => (
                <ImageSlot
                  key={`t${l}`}
                  title={`Tayyor mahsulot ${l}`}
                  hint="Qolipdan chiqqan plitka / element"
                  url={p.images.tiles[l] ?? null}
                  role="tile"
                  onChange={(url) => setImage('tiles', l, url)}
                />
              ))}
            </div>
          </section>

          <section className="adm-card">
            <h2>Qoliplar {isMold ? '' : '(qolip bo\'lmagan mahsulot uchun bo\'sh qoldiring)'}</h2>
            <table className="adm-items adm-edit">
              <thead>
                <tr>
                  <th>Harf</th>
                  <th>O'lcham, mm</th>
                  <th>Chuqurlik, mm</th>
                  <th>Vazn, g</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {p.molds.map((m, i) => (
                  <tr key={i}>
                    <td>
                      <input className="sps-input" value={m.l} onChange={(e) => set('molds', p.molds.map((x, j) => (j === i ? { ...x, l: e.target.value } : x)))} aria-label="Harf" />
                    </td>
                    <td>
                      <input className="sps-input" value={m.size ?? ''} placeholder="300×300" onChange={(e) => set('molds', p.molds.map((x, j) => (j === i ? { ...x, size: e.target.value || null } : x)))} aria-label="O'lcham" />
                    </td>
                    <td>
                      <input className="sps-input" value={m.depth ?? ''} placeholder="30" onChange={(e) => set('molds', p.molds.map((x, j) => (j === i ? { ...x, depth: e.target.value || null } : x)))} aria-label="Chuqurlik" />
                    </td>
                    <td>
                      <input
                        className="sps-input"
                        type="number"
                        value={m.g ?? ''}
                        onChange={(e) => set('molds', p.molds.map((x, j) => (j === i ? { ...x, g: e.target.value ? Number(e.target.value) : null } : x)))}
                        aria-label="Vazn"
                      />
                    </td>
                    <td>
                      <button type="button" className="sps-btn sps-btn--link sps-btn--sm" onClick={() => set('molds', p.molds.filter((_, j) => j !== i))} aria-label="Qatorni o'chirish">
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {p.molds.length < 3 ? (
              <button type="button" className="sps-btn sps-btn--outline sps-btn--sm" onClick={() => set('molds', [...p.molds, { l: LETTERS[p.molds.length], size: null, depth: null, g: null }])}>
                + Qolip qatori
              </button>
            ) : null}
            <div className="adm-row3" style={{ marginTop: 14 }}>
              <label className="sps-field">
                <span>1 m² uchun qoliplar vazni, kg</span>
                <input className="sps-input" aria-label="1 m² uchun qoliplar vazni" value={p.kg ?? ''} placeholder="3,52" onChange={(e) => set('kg', e.target.value || null)} />
              </label>
              <label className="adm-check" style={{ alignSelf: 'end' }}>
                <input type="checkbox" aria-label="O'lcham taxminiy" checked={p.sizeEstimated} onChange={(e) => set('sizeEstimated', e.target.checked)} /> O'lcham taxminiy (*)
              </label>
            </div>
          </section>

          <section className="adm-card">
            <h2>Tayyor mahsulot (plitka)</h2>
            <table className="adm-items adm-edit">
              <thead>
                <tr>
                  <th>Harf</th>
                  <th>O'lcham, mm</th>
                  <th>1 m² ga dona</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {p.tiles.map((t, i) => (
                  <tr key={i}>
                    <td>
                      <input className="sps-input" value={t.l} onChange={(e) => set('tiles', p.tiles.map((x, j) => (j === i ? { ...x, l: e.target.value } : x)))} aria-label="Harf" />
                    </td>
                    <td>
                      <input className="sps-input" value={t.size ?? ''} placeholder="300×300×30" onChange={(e) => set('tiles', p.tiles.map((x, j) => (j === i ? { ...x, size: e.target.value || null } : x)))} aria-label="O'lcham" />
                    </td>
                    <td>
                      <input className="sps-input" value={t.per ?? ''} placeholder="11" onChange={(e) => set('tiles', p.tiles.map((x, j) => (j === i ? { ...x, per: e.target.value || null } : x)))} aria-label="1 m² ga dona" />
                    </td>
                    <td>
                      <button type="button" className="sps-btn sps-btn--link sps-btn--sm" onClick={() => set('tiles', p.tiles.filter((_, j) => j !== i))} aria-label="Qatorni o'chirish">
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {p.tiles.length < 3 ? (
              <button type="button" className="sps-btn sps-btn--outline sps-btn--sm" onClick={() => set('tiles', [...p.tiles, { l: LETTERS[p.tiles.length], size: null, per: null }])}>
                + Plitka qatori
              </button>
            ) : null}
          </section>

          <section className="adm-card">
            <h2>Texnik jadval (qo'shimcha xususiyatlar)</h2>
            {p.specs.map((s, i) => (
              <div key={i} className="adm-spec">
                <LocalizedInputs label={`Xususiyat ${i + 1}`} value={s.k} onChange={(k) => set('specs', p.specs.map((x, j) => (j === i ? { ...x, k } : x)))} />
                <LocalizedInputs label="Qiymati" value={s.v} onChange={(v) => set('specs', p.specs.map((x, j) => (j === i ? { ...x, v } : x)))} />
                <button type="button" className="sps-btn sps-btn--link sps-btn--sm" onClick={() => set('specs', p.specs.filter((_, j) => j !== i))}>
                  Xususiyatni o'chirish
                </button>
              </div>
            ))}
            <button
              type="button"
              className="sps-btn sps-btn--outline sps-btn--sm"
              onClick={() => set('specs', [...p.specs, { k: { uz: null, ru: null, en: null }, v: { uz: null, ru: null, en: null } }])}
            >
              + Xususiyat
            </button>
          </section>
        </div>

        <div className="adm-grid adm-sticky">
          <section className="adm-card">
            <h2>Holat</h2>
            <div className="adm-statusbar">
              {(['published', 'draft', 'archived'] as const).map((s) => (
                <button key={s} type="button" aria-pressed={p.status === s} onClick={() => set('status', s)}>
                  {PRODUCT_STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            <p className="adm-empty" style={{ marginTop: 10 }}>
              Nashrda — saytda ko'rinadi (keyingi "Nashr qilish"dan keyin). Arxiv — saytdan olib tashlanadi, ma'lumot saqlanadi.
            </p>
            {state?.error ? (
              <p className="adm-msg adm-msg--err" role="alert" style={{ marginTop: 12 }}>
                {state.error}
              </p>
            ) : null}
            {state?.ok ? (
              <p className="adm-msg adm-msg--ok" role="status" style={{ marginTop: 12 }}>
                {state.ok}
              </p>
            ) : null}
            <button className="sps-btn sps-btn--primary" type="submit" disabled={saving} style={{ marginTop: 12, width: '100%' }}>
              {saving ? 'Saqlanmoqda…' : 'Saqlash'}
            </button>
            {liveUrl ? (
              <a className="sps-btn sps-btn--link sps-btn--sm" href={liveUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 8 }}>
                Saytda ochish ↗
              </a>
            ) : null}
          </section>
        </div>
      </div>
    </form>
  );
}
