import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { listReservations, updateReservationStatus } from "../api/reservations";
import { clearToken } from "../lib/auth";
import { todayISO } from "../lib/dates";
import type { Reservation, ReservationStatus } from "../types";
import { ErrorMessage } from "../components/ErrorMessage";

const statusLabel: Record<ReservationStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
};

const statusClass: Record<ReservationStatus, string> = {
  PENDING: "bg-saffron/15 text-saffron",
  CONFIRMED: "bg-azulejo-soft text-azulejo",
  CANCELLED: "bg-ink/5 text-ink/50",
};

export function AdminPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayISO());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleSessionExpired = useCallback(() => {
    clearToken();
    navigate("/admin/login");
  }, [navigate]);

  const fetchDay = useCallback(() => {
    setStatus("loading");
    listReservations(date)
      .then((rows) => {
        setReservations(rows);
        setStatus("success");
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          handleSessionExpired();
          return;
        }
        setStatus("error");
      });
  }, [date, handleSessionExpired]);

  useEffect(fetchDay, [fetchDay]);

  async function changeStatus(id: number, newStatus: "CONFIRMED" | "CANCELLED") {
    setUpdatingId(id);
    try {
      const updated = await updateReservationStatus(id, newStatus);
      setReservations((rows) => rows.map((row) => (row.id === id ? updated : row)));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleSessionExpired();
      }
    } finally {
      setUpdatingId(null);
    }
  }

  function logout() {
    clearToken();
    navigate("/admin/login");
  }

  const totalGuests = reservations
    .filter((r) => r.status !== "CANCELLED")
    .reduce((sum, r) => sum + r.partySize, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <header className="flex items-end justify-between py-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-saffron">
            Administración
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-azulejo">Reservas</h1>
        </div>
        <button onClick={logout} className="text-sm text-ink/60 underline hover:text-azulejo">
          Salir
        </button>
      </header>

      <div className="flex items-center justify-between gap-4">
        <input
          type="date"
          aria-label="Día"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-azulejo-soft bg-white px-3 py-2 focus:border-azulejo focus:outline-2 focus:outline-offset-2 focus:outline-saffron"
        />
        {status === "success" && (
          <p className="text-sm text-ink/60">
            {reservations.length} reservas · {totalGuests} comensales
          </p>
        )}
      </div>

      <div className="mt-6">
        {status === "loading" && <p className="py-12 text-center text-ink/50">Cargando…</p>}

        {status === "error" && (
          <ErrorMessage message="No hemos podido cargar las reservas." onRetry={fetchDay} />
        )}

        {status === "success" && reservations.length === 0 && (
          <p className="rounded-lg border border-dashed border-azulejo-soft py-12 text-center text-ink/50">
            Sin reservas para este día.
          </p>
        )}

        {status === "success" && reservations.length > 0 && (
          <ul className="space-y-3">
            {reservations.map((reservation) => (
              <li
                key={reservation.id}
                className="rounded-lg border border-azulejo-soft bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg font-semibold text-azulejo">
                      {reservation.time}
                    </span>
                    <div>
                      <p className="font-medium">{reservation.customerName}</p>
                      <p className="text-sm text-ink/60">
                        {reservation.partySize} pers · {reservation.table?.name ?? "sin mesa"} ·{" "}
                        <a href={`tel:${reservation.customerPhone}`} className="underline">
                          {reservation.customerPhone}
                        </a>
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass[reservation.status]}`}
                  >
                    {statusLabel[reservation.status]}
                  </span>
                </div>

                {reservation.status !== "CANCELLED" && (
                  <div className="mt-3 flex gap-2 border-t border-azulejo-soft pt-3">
                    {reservation.status === "PENDING" && (
                      <button
                        onClick={() => changeStatus(reservation.id, "CONFIRMED")}
                        disabled={updatingId === reservation.id}
                        className="rounded-md bg-azulejo px-3 py-1.5 text-sm font-medium text-white hover:bg-azulejo/90 disabled:opacity-60"
                      >
                        Confirmar
                      </button>
                    )}
                    <button
                      onClick={() => changeStatus(reservation.id, "CANCELLED")}
                      disabled={updatingId === reservation.id}
                      className="rounded-md border border-azulejo-soft px-3 py-1.5 text-sm text-ink/70 hover:border-red-300 hover:text-red-700 disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
