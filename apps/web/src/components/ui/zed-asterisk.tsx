import { cn } from '@/lib/utils';

export const ZED_BULLET_GRADIENT =
  'linear-gradient(to bottom, var(--zed-red), var(--zed-green), var(--zed-blue), var(--zed-yellow), var(--zed-purple), var(--zed-red))';

const ASTERISK_ARMS = [
  { className: 'z-10' },
  { className: 'z-20 rotate-90' },
  { className: 'z-30 rotate-45' },
  { className: 'z-40 -rotate-45' },
] as const;

export function ZedAsterisk({
  index,
  parentClass,
  variant = 'gradient',
}: {
  index: number;
  parentClass?: string;
  variant?: 'gradient' | 'solid';
}) {
  return (
    <div
      className={cn('relative mt-1 flex size-6 shrink-0 items-center justify-center', parentClass)}
    >
      {ASTERISK_ARMS.map(({ className }, armIndex) => (
        <div
          key={armIndex}
          className={cn(
            'absolute h-3.5 w-px shrink-0 rounded-full',
            variant === 'gradient' && 'animate-zed-bullet-flow bg-[length:100%_300%]',
            className,
          )}
          style={
            variant === 'gradient'
              ? {
                  backgroundImage: ZED_BULLET_GRADIENT,
                  animationDelay: `${index * 0.4 + armIndex * 0.08}s`,
                }
              : { backgroundColor: 'var(--foreground)' }
          }
        />
      ))}
    </div>
  );
}
