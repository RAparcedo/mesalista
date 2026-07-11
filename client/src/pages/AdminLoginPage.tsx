import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { login as requestLogin } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // Already logged in? Straight to the panel — no pointless login form.
  if (isLoggedIn) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      const token = await requestLogin(email, password);
      login(token);
      navigate("/admin");
    } catch {
      setError("Email o contraseña incorrectos");
    } finally {
      setSending(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-md border border-azulejo-soft bg-white px-3 py-2 text-ink focus:border-azulejo focus:outline-2 focus:outline-offset-2 focus:outline-saffron";

  return (
    <div className="mx-auto max-w-sm px-4 pb-16">
      <header className="py-10 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-saffron">Administración</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-azulejo">Iniciar sesión</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-md bg-azulejo px-6 py-3 font-medium text-white hover:bg-azulejo/90 focus:outline-2 focus:outline-offset-2 focus:outline-saffron disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
