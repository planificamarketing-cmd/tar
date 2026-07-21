'use client';

import { useEffect } from 'react';
import type { PublicScripts } from '@/lib/public';

// Inyección de los scripts de marketing con placement `body`/`footer` (§6.5/§7.1).
// El código se captura en el backoffice como snippet arbitrario (GTM, píxeles,
// chats). Insertar vía innerHTML NO ejecuta los <script>, así que recreamos cada
// nodo <script> para que corra — igual que lo haría el navegador con el snippet
// original. Se inyecta una sola vez por id (guarda global anti-duplicado, también
// en Strict Mode de desarrollo).
//
// Los de placement `head` NO se manejan aquí: se sirven en SSR
// (`MarketingScriptsHead`) para que carguen antes de la hidratación.

const injected = new Set<string>();

function injectCode(code: string, target: HTMLElement, prepend: boolean) {
  const tpl = document.createElement('template');
  tpl.innerHTML = code.trim();
  const nodes = Array.from(tpl.content.childNodes);
  const frag = document.createDocumentFragment();
  for (const node of nodes) {
    if (node.nodeName === 'SCRIPT') {
      const src = node as HTMLScriptElement;
      const s = document.createElement('script');
      for (const attr of Array.from(src.attributes)) s.setAttribute(attr.name, attr.value);
      s.text = src.text;
      frag.appendChild(s);
    } else {
      frag.appendChild(node.cloneNode(true));
    }
  }
  if (prepend && target.firstChild) target.insertBefore(frag, target.firstChild);
  else target.appendChild(frag);
}

export function MarketingScripts({ scripts }: { scripts: PublicScripts }) {
  useEffect(() => {
    const run = (
      list: { id: string; code: string }[],
      target: HTMLElement,
      prepend = false,
    ) => {
      for (const s of list) {
        if (injected.has(s.id) || !s.code?.trim()) continue;
        injected.add(s.id);
        try {
          injectCode(s.code, target, prepend);
        } catch {
          /* un snippet inválido no debe tumbar el sitio */
        }
      }
    };
    run(scripts.body, document.body, true);
    run(scripts.footer, document.body);
  }, [scripts]);

  return null;
}
