'use client';

import { ZedLogo as UiZedLogo } from '@/components/ui/zed-logo';

interface ZedLogoProps {
  size?: number;
  variant?: 'symbol' | 'logomark';
  className?: string;
}

/**
 * Back-compat shim over the canonical `@/components/ui/zed-logo` —
 * `symbol` maps to `icon`, `logomark` maps to `brandmark`. New code should
 * import the ui component directly.
 */
export function ZedLogo({ size = 24, variant = 'symbol', className }: ZedLogoProps) {
  return (
    <UiZedLogo
      size={size}
      variant={variant === 'logomark' ? 'brandmark' : 'icon'}
      className={className}
    />
  );
}
