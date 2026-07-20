'use client';

import { useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';

// Registra una visualización de la propiedad (POST /events/track) una sola vez
// al montar la ficha. Best-effort: nunca interrumpe la navegación.
export function TrackView({ propertyId }: { propertyId: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    apiFetch('/events/track', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ propertyId, type: 'view' }),
    }).catch(() => {
      /* la analítica no debe romper la página */
    });
  }, [propertyId]);
  return null;
}
