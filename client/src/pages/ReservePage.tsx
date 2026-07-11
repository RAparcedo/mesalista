import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createReservation } from "../api/reservations";
import { getSettings } from "../api/settings";
import type { Settings } from "../api/settings";
import { ApiError } from "../api/client";
import type { Reservation } from "../types";
import { todayISO } from "../lib/dates";
import { TileDivider } from "../components/TileDivider";

export function ReservePage() {
  // The restaurant's real slots and party cap come from the API — the
  // owner edits them in the admin panel, so nothing is hardcoded here.
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    date: todayISO(),
    time: "",
    partySize: 2,
  });

  useEffect(() => {
    getSettings().then((loaded) => {
      setSettings(loaded);
      // Preselect the first dinner slot (or the first slot there is).
      const dinner = loaded.timeSlots.find((slot) => slot >= "20:00");
      setForm((prev) => ({ ...prev, time: dinner ?? loaded.timeSlots[0] ?? "" }));
    });
    // On failure settings stays null; the form shows a hint and the server
    // still validates everything if the user manages to submit.
  }, []);
  const [sending, setSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState("");
  const [confirmed, setConfirmed] = useState<Reservation | null>(null);

  function update(field: string, value: string | number) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setFieldErrors({});
    setGeneralError("");
    try {
      const reservation = await createReservation(form);
      setConfirmed(reservation);
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        setFieldErrors(error.fields);
      } else {
        setGeneralError("No hemos podido registrar la reserva. Inténtalo de nuevo en unos minutos.");
      }
    } finally {
      setSending(false);
    }
  }

  if (confirmed) {
    const prettyDate = new Date(confirmed.date).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC", // the date is UTC midnight; keep the day intact
    });
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-saffron">Solicitud recibida</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-azulejo">
          ¡Gracias, {confirmed.customerName}!
        </h1>
        <div className="mt-6 rounded-lg border border-azulejo-soft bg-white p-6 text-left">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/60">Día</dt>
              <dd className="font-medium">{prettyDate}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/60">Hora</dt>
              <dd className="font-medium">{confirmed.time}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/60">Personas</dt>
              <dd className="font-medium">{confirmed.partySize}</dd>
            </div>
          </dl>
        </div>
        <p className="mt-4 text-sm text-ink/60">
          Tu reserva está pendiente de confirmación. Te llamaremos al {confirmed.customerPhone} si
          hay cualquier cambio.
        </p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-azulejo underline">
          Volver a la carta
        </Link>
      </div>
    );
  }

  const inputClass =
    "mt-1 w-full rounded-md border border-azulejo-soft bg-white px-3 py-2 text-ink focus:border-azulejo focus:outline-2 focus:outline-offset-2 focus:outline-saffron";

  return (
    <div className="mx-auto max-w-md px-4 pb-16">
      <header className="py-12 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-saffron">Reservas</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-azulejo">Tu mesa</h1>
        <div className="mt-5">
          <TileDivider />
        </div>
        <p className="mt-5 text-sm text-ink/60">
          {settings
            ? `Horarios de ${settings.timeSlots[0]} a ${settings.timeSlots[settings.timeSlots.length - 1]}`
            : "Cargando horarios…"}
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-xl border border-azulejo-soft bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="customerName" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="customerName"
            className={inputClass}
            value={form.customerName}
            onChange={(e) => update("customerName", e.target.value)}
            required
          />
          <FieldError messages={fieldErrors.customerName} />
        </div>

        <div>
          <label htmlFor="customerPhone" className="text-sm font-medium">
            Teléfono
          </label>
          <input
            id="customerPhone"
            type="tel"
            placeholder="612 345 678"
            className={inputClass}
            value={form.customerPhone}
            onChange={(e) => update("customerPhone", e.target.value)}
            required
          />
          <FieldError messages={fieldErrors.customerPhone} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="text-sm font-medium">
              Día
            </label>
            <input
              id="date"
              type="date"
              min={todayISO()}
              className={inputClass}
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              required
            />
            <FieldError messages={fieldErrors.date} />
          </div>
          <div>
            <label htmlFor="time" className="text-sm font-medium">
              Hora
            </label>
            <select
              id="time"
              className={inputClass}
              value={form.time}
              onChange={(e) => update("time", e.target.value)}
              disabled={!settings}
            >
              {(settings?.timeSlots ?? []).map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            <FieldError messages={fieldErrors.time} />
          </div>
        </div>

        <div>
          <label htmlFor="partySize" className="text-sm font-medium">
            Personas
          </label>
          <select
            id="partySize"
            className={inputClass}
            value={form.partySize}
            onChange={(e) => update("partySize", Number(e.target.value))}
            disabled={!settings}
          >
            {Array.from({ length: settings?.maxPartySize ?? 6 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "persona" : "personas"}
              </option>
            ))}
          </select>
          <FieldError messages={fieldErrors.partySize} />
        </div>

        {generalError && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {generalError}
          </p>
        )}

        <button
          type="submit"
          disabled={sending || !settings}
          className="w-full rounded-md bg-saffron px-6 py-3 font-medium text-ink hover:bg-saffron/90 focus:outline-2 focus:outline-offset-2 focus:outline-azulejo disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Enviando…" : "Solicitar reserva"}
        </button>

        <p className="text-center text-xs text-ink/50">
          ¿Más de {settings?.maxPartySize ?? 6} personas? Llámanos y lo organizamos.
        </p>
      </form>
    </div>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <p role="alert" className="mt-1 text-sm text-red-700">
      {messages[0]}
    </p>
  );
}
