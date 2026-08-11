/**
 * The mode bootstrap: tells the client whether this server is running in
 * wrapper mode (`ZED_API_KEY` set) or direct mode. `Providers` fetches this
 * once on load, before any Zed data call, and configures the SDK
 * accordingly — see `src/app/providers.tsx` + `src/lib/zed.ts`.
 *
 * Deriving this from the server env (rather than a client-only
 * `NEXT_PUBLIC_*` flag) means there's exactly one source of truth: whichever
 * mode the proxy route itself will actually enforce.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ wrapperMode: !!process.env.ZED_API_KEY });
}
