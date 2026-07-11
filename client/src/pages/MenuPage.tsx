import { Link } from "react-router-dom";
import { useMenu } from "../hooks/useMenu";
import { CategorySection } from "../components/CategorySection";
import { LoadingMenu } from "../components/LoadingMenu";
import { ErrorMessage } from "../components/ErrorMessage";

export function MenuPage() {
  const { menu, status, retry } = useMenu();

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <header className="py-10 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-saffron">
          Cocina de mercado
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-azulejo">La Carta</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink/60">
          Producto de temporada, recetas de siempre. La carta cambia con el mercado.
        </p>
      </header>

      {status === "loading" && <LoadingMenu />}

      {status === "error" && (
        <ErrorMessage
          message="No hemos podido cargar la carta. Comprueba tu conexión e inténtalo de nuevo."
          onRetry={retry}
        />
      )}

      {status === "success" && (
        <>
          {/* Category index — jumps to each section */}
          <nav aria-label="Categorías" className="sticky top-0 -mx-4 mb-6 bg-paper/95 px-4 py-3 backdrop-blur">
            <ul className="flex gap-2 overflow-x-auto">
              {menu.map((category) => (
                <li key={category.id}>
                  <a
                    href={`#categoria-${category.id}`}
                    className="whitespace-nowrap rounded-full border border-azulejo-soft bg-white px-3 py-1 text-sm text-azulejo hover:border-azulejo focus:outline-2 focus:outline-offset-2 focus:outline-saffron"
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-10">
            {menu.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))}
          </div>

          <div className="mt-14 rounded-lg bg-azulejo px-6 py-8 text-center">
            <p className="font-display text-xl italic text-white">¿Te quedas a cenar?</p>
            <Link
              to="/reservar"
              className="mt-4 inline-block rounded-md bg-saffron px-6 py-2.5 font-medium text-ink hover:bg-saffron/90 focus:outline-2 focus:outline-offset-2 focus:outline-white"
            >
              Reservar mesa
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
