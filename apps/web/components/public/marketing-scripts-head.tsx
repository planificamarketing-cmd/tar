import type { PublicScripts } from '@/lib/public';

// Scripts de marketing con placement `head`, renderizados en SSR (Server
// Component, sin useEffect): van en el HTML inicial y el navegador los ejecuta al
// PARSEAR la página, antes de la hidratación de React. Necesario para GTM y CMP de
// consentimiento, que deben cargar lo antes posible.
//
// Los <script> dentro de HTML servido por SSR SÍ se ejecutan al parsear (a
// diferencia de innerHTML en el cliente), por eso basta con volcar el snippet con
// dangerouslySetInnerHTML. Se renderiza al inicio del árbol del layout público, así
// que corre antes que el resto de la página.
//
// El injector cliente (`MarketingScripts`) se encarga SOLO de `body`/`footer`; el
// `head` se sirve aquí en SSR para no duplicarlo.
export function MarketingScriptsHead({ scripts }: { scripts: PublicScripts }) {
  const code = scripts.head
    .map((s) => s.code?.trim())
    .filter(Boolean)
    .join('\n');
  if (!code) return null;
  return <div data-marketing="head" dangerouslySetInnerHTML={{ __html: code }} />;
}
