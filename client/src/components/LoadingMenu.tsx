// Skeleton shaped like the carta it's about to become.
export function LoadingMenu() {
  return (
    <div aria-label="Cargando la carta" role="status" className="animate-pulse space-y-8">
      {[1, 2, 3].map((section) => (
        <div key={section}>
          <div className="h-7 w-40 rounded bg-azulejo-soft" />
          <div className="mt-4 space-y-4">
            {[1, 2, 3].map((row) => (
              <div key={row} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-48 rounded bg-azulejo-soft" />
                  <div className="h-px flex-1" />
                  <div className="h-4 w-12 rounded bg-azulejo-soft" />
                </div>
                <div className="h-3 w-72 max-w-full rounded bg-azulejo-soft/60" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
