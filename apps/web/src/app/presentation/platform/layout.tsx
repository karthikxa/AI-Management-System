import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zed — Product deck',
  description:
    'A complete, in-depth walkthrough of the Zed platform — the Autonomous Company Operating System.',
  robots: { index: false, follow: false },
};

export default function PlatformPresentationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
