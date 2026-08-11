import { ZedHyperLogo } from '@/components/ui/marketing/zed-hyper-logo';

/**
 * Shared fallback for Next.js route-segment `loading.tsx` files — the Zed
 * ASCII logo loader, shown during navigation/streaming instead of a blank frame.
 */
export function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <ZedHyperLogo size={72} startOnView={false} loop className="text-foreground" />
    </div>
  );
}
