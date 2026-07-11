import { NavLink, Route, Routes } from "react-router-dom";
import { MenuPage } from "./pages/MenuPage";
import { ReservePage } from "./pages/ReservePage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminPage } from "./pages/AdminPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 pb-0.5 text-sm font-medium transition-colors ${
    isActive ? "border-saffron text-azulejo" : "border-transparent text-ink/60 hover:text-azulejo"
  }`;

export default function App() {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <nav className="border-b border-azulejo-soft">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <NavLink to="/" className="font-display text-xl font-semibold italic text-azulejo">
            MesaLista
          </NavLink>
          <div className="flex gap-6">
            <NavLink to="/" end className={navLinkClass}>
              La carta
            </NavLink>
            <NavLink to="/reservar" className={navLinkClass}>
              Reservar
            </NavLink>
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/reservar" element={<ReservePage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <footer className="border-t border-azulejo-soft py-6 text-center text-xs text-ink/50">
        MesaLista · Calle Mayor 12 · 91 234 56 78
      </footer>
    </div>
  );
}
