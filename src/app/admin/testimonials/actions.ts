'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/server/session';
import { deleteTestimonial, saveTestimonial } from '@/server/testimonials';

export type TestimonialFormState = { error?: string; ok?: string } | undefined;

const loc = (fd: FormData, prefix: string) => ({
  uz: String(fd.get(`${prefix}_uz`) ?? '').trim() || null,
  ru: String(fd.get(`${prefix}_ru`) ?? '').trim() || null,
  en: String(fd.get(`${prefix}_en`) ?? '').trim() || null,
});

export async function saveTestimonialAction(_prev: TestimonialFormState, fd: FormData): Promise<TestimonialFormState> {
  const { db } = await requireUser();
  const id = Number(fd.get('testimonialId')) || null;
  const ratingRaw = String(fd.get('rating') ?? '').trim();
  const err = await saveTestimonial(db, id, {
    authorName: loc(fd, 'author_name'),
    authorRole: loc(fd, 'author_role'),
    text: loc(fd, 'text'),
    rating: ratingRaw ? Number(ratingRaw) : null,
    sort: Number(fd.get('sort')) || 100,
    visible: fd.get('visible') === 'on',
  });
  if (err) return { error: err };
  revalidatePath('/admin/testimonials');
  return { ok: 'Saqlandi.' };
}

export async function deleteTestimonialAction(fd: FormData): Promise<void> {
  const { db } = await requireUser();
  await deleteTestimonial(db, Number(fd.get('testimonialId')));
  revalidatePath('/admin/testimonials');
}
