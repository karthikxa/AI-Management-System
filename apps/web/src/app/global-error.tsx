'use client';

import { SystemFaultView } from '@/components/common/system-fault';

// NOTE: This global error boundary renders OUTSIDE the provider tree
// (I18nProvider, ThemeProvider, etc.), so it cannot use useTranslations
// or any context-dependent hooks. Use hardcoded strings instead.

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>System Fault</title>
      </head>
      <body style={{ margin: 0 }}>
        <SystemFaultView error={error} />
      </body>
    </html>
  );
}
