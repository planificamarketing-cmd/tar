// Estado de carga del listado: se muestra mientras Next re-renderiza la página en
// el servidor al cambiar filtros/orden/página (navegación SSR). Sin esto, el cambio
// de filtros no da ninguna señal visual hasta que llega el HTML nuevo. Réplica
// esquemática del layout real (barra + sidebar + cuadrícula) para evitar saltos.
export default function ListingsLoading() {
  return (
    <div className="min-h-screen bg-canvas pt-[84px]">
      {/* Barra superior */}
      <div className="border-b border-[#F1F1F0] bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <div>
            <div className="h-7 w-40 animate-pulse rounded-md bg-[#ECECEA]" />
            <div className="mt-1.5 h-3.5 w-24 animate-pulse rounded bg-[#F1F1F0]" />
          </div>
          <div className="h-9 w-48 animate-pulse rounded-full bg-[#ECECEA]" />
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-4 py-6 lg:flex-row lg:gap-7 lg:px-8 lg:py-8">
        {/* Sidebar escritorio */}
        <aside className="hidden w-[240px] shrink-0 lg:block">
          <div className="sticky top-[100px] rounded-2xl border border-[#F1F1F0] bg-white p-5">
            <div className="mb-4 h-5 w-20 animate-pulse rounded bg-[#ECECEA]" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-[#F1F1F0]" />
              ))}
            </div>
          </div>
        </aside>

        {/* Cuadrícula de tarjetas */}
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }, (_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-[#F1F1F0] bg-white"
              >
                <div className="aspect-[4/3] animate-pulse bg-[#ECECEA]" />
                <div className="flex flex-col gap-2.5 p-4">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-[#ECECEA]" />
                  <div className="h-3.5 w-1/2 animate-pulse rounded bg-[#F1F1F0]" />
                  <div className="mt-1 h-3.5 w-3/4 animate-pulse rounded bg-[#F1F1F0]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
