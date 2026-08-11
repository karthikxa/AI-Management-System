import type { Metadata } from 'next';
import { ZedParticleMark } from './zed-particle-mark';

export const metadata: Metadata = {
  title: 'Particle Mark — Zed',
  description: 'A Rauch-style hard-pixel particle rendering of the Zed symbol.',
  robots: { index: false, follow: false },
};

export default function RauchPage() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-background">
      <ZedParticleMark />
    </main>
  );
}
