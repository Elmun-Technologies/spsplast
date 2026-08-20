import './globals.css';

export const metadata = {
  title: 'SPS PLAST — Termopanel, Bruschatka va Beton Qoliplari',
  description: 'O‘zbekistonda termopanel, bruschatka qoliplari va beton mahsulotlari uchun sifatli plastik qoliplar ishlab chiqarish.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
