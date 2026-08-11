'use client';

import { ZedLoader } from '@/components/ui/zed-loader';
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center justify-center', className)}>
      <ZedLoader customSize={16} />
    </span>
  );
}
