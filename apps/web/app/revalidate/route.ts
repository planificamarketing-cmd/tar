import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

// Revalidación on-demand (ISR) disparada por la API cuando una propiedad se
// publica, despublica o cambia de estatus. Sin esto, una propiedad recién
// publicada tarda hasta la ventana de ISR (hasta 1 h) en aparecer.
//
// Vive en `/revalidate` (NO bajo `/api/*`, que Caddy enruta a Express en el
// modo de un solo origen). Protegido por un secreto compartido con la API
// (`REVALIDATE_SECRET`, variable de servidor — NO `NEXT_PUBLIC_`). Sin el
// secreto configurado responde 501 (desactivado): el sitio sigue refrescándose
// solo por tiempo.
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'revalidation_disabled' }, { status: 501 });
  }
  if (req.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { paths?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  // Solo rutas absolutas del propio sitio; se ignora cualquier otra cosa.
  const paths = Array.isArray(body.paths)
    ? body.paths.filter((p): p is string => typeof p === 'string' && p.startsWith('/'))
    : [];

  for (const p of paths) revalidatePath(p);
  return NextResponse.json({ revalidated: true, paths });
}
