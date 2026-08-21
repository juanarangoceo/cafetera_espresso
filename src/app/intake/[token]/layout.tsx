import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brief de producto · Nitro Landing',
  description: 'Carga privada de información y material para tu landing.',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

export default function IntakeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
