import React from 'react';
import { notFound } from 'next/navigation';
import { MockStorefront } from './MockStorefront';

export const metadata = {
  title: 'UI Preview — SPS',
  robots: { index: false, follow: false },
};

/**
 * Development-only preview of the storefront critical flow
 * (Header → ProductCard → Product detail → Cart drawer).
 *
 * It renders the real components with mock data so UI work can be reviewed
 * without a database connection. Never available in production builds.
 */
export default function UIPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <MockStorefront />;
}
