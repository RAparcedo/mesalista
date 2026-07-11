import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-1.5 text-sm font-medium ${
    isActive ? "bg-azulejo text-white" : "text-ink/60 hover:text-azulejo"
  }`;

// Shared frame for every admin page: title, section tabs and logout.
export function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <header className="flex items-end justify-between py-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-saffron">
            Administración
          </p>
          <div className="mt-2 flex gap-2">
            <NavLink to="/admin" end className={tabClass}>
              Reservas
            </NavLink>
            <NavLink to="/admin/carta" className={tabClass}>
              Carta
            </NavLink>
          </div>
        </div>
        <button onClick={handleLogout} className="text-sm text-ink/60 underline hover:text-azulejo">
          Salir
        </button>
      </header>

      <Outlet />
    </div>
  );
}
