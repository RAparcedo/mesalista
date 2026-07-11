import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { getSettings, updateSettings } from "../api/settings";
import type { Settings } from "../api/settings";
import { createTable, deleteTable, listTables, updateTable } from "../api/tables";
import type { TableInput } from "../api/tables";
import { useAuth } from "../context/AuthContext";
import type { RestaurantTable } from "../types";
import { ErrorMessage } from "../components/ErrorMessage";

export function AdminRestaurantPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handle401 = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate("/admin/login");
        return true;
      }
      return false;
    },
    [logout, navigate],
  );

  return (
    <div className="space-y-10">
      <TablesSection on401={handle401} />
      <HoursSection on401={handle401} />
    </div>
  );
}

// ---------- Mesas ----------

function TablesSection({ on401 }: { on401: (error: unknown) => boolean }) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [editing, setEditing] = useState<"new" | number | null>(null); // id when editing
  const [rowError, setRowError] = useState("");

  const reload = useCallback(() => {
    listTables()
      .then((rows) => {
        setTables(rows);
        setStatus("success");
      })
      .catch((error) => {
        if (!on401(error)) setStatus("error");
      });
  }, [on401]);

  useEffect(() => {
    setStatus("loading");
    reload();
  }, [reload]);

  async function removeTable(table: RestaurantTable) {
    if (!window.confirm(`¿Borrar "${table.name}"?`)) return;
    setRowError("");
    try {
      await deleteTable(table.id);
      reload();
    } catch (error) {
      if (on401(error)) return;
      // 409: the table has upcoming reservations — surface the server's message.
      setRowError(error instanceof ApiError ? error.message : "No se ha podido borrar la mesa.");
    }
  }

  const totalSeats = tables.reduce((sum, table) => sum + table.capacity, 0);

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold italic text-azulejo">Mesas</h2>
        <button
          onClick={() => setEditing("new")}
          className="text-sm font-medium text-azulejo hover:underline"
        >
          + Añadir mesa
        </button>
      </div>
      {status === "success" && (
        <p className="mt-1 text-sm text-ink/60">
          {tables.length} mesas · {totalSeats} plazas en total
        </p>
      )}

      {status === "loading" && <p className="py-8 text-center text-ink/50">Cargando…</p>}
      {status === "error" && (
        <ErrorMessage message="No hemos podido cargar las mesas." onRetry={reload} />
      )}

      {editing === "new" && (
        <TableForm
          initial={{ name: "", capacity: 2 }}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
          onCancel={() => setEditing(null)}
          on401={on401}
        />
      )}

      {rowError && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {rowError}
        </p>
      )}

      {status === "success" && (
        <ul className="mt-3 divide-y divide-azulejo-soft">
          {tables.map((table) =>
            editing === table.id ? (
              <li key={table.id} className="py-3">
                <TableForm
                  tableId={table.id}
                  initial={{ name: table.name, capacity: table.capacity }}
                  onSaved={() => {
                    setEditing(null);
                    reload();
                  }}
                  onCancel={() => setEditing(null)}
                  on401={on401}
                />
              </li>
            ) : (
              <li key={table.id} className="flex items-center justify-between gap-2 py-3">
                <p className="font-medium">
                  {table.name}{" "}
                  <span className="text-sm font-normal text-ink/60">
                    · {table.capacity} {table.capacity === 1 ? "plaza" : "plazas"}
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(table.id)}
                    className="rounded-md border border-azulejo-soft px-3 py-1.5 text-sm text-ink/70 hover:border-azulejo hover:text-azulejo"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => removeTable(table)}
                    className="rounded-md border border-azulejo-soft px-3 py-1.5 text-sm text-ink/70 hover:border-red-300 hover:text-red-700"
                  >
                    Borrar
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}

function TableForm({
  tableId,
  initial,
  onSaved,
  onCancel,
  on401,
}: {
  tableId?: number;
  initial: TableInput;
  onSaved: () => void;
  onCancel: () => void;
  on401: (error: unknown) => boolean;
}) {
  const [form, setForm] = useState<TableInput>(initial);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      if (tableId === undefined) {
        await createTable(form);
      } else {
        await updateTable(tableId, form);
      }
      onSaved();
    } catch (error) {
      if (!on401(error) && error instanceof ApiError && error.fields) {
        setFieldErrors(error.fields);
      }
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-md border border-azulejo-soft bg-white px-3 py-2 text-sm focus:border-azulejo focus:outline-2 focus:outline-offset-2 focus:outline-saffron";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-3 rounded-lg border border-azulejo-soft bg-white p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="table-name" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="table-name"
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Mesa 7, Terraza 3…"
            required
          />
          <FieldError messages={fieldErrors.name} />
        </div>
        <div>
          <label htmlFor="table-capacity" className="text-sm font-medium">
            Plazas
          </label>
          <input
            id="table-capacity"
            type="number"
            min="1"
            max="20"
            className={inputClass}
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
            required
          />
          <FieldError messages={fieldErrors.capacity} />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-azulejo px-4 py-2 text-sm font-medium text-white hover:bg-azulejo/90 disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-azulejo-soft px-4 py-2 text-sm text-ink/70 hover:border-azulejo"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ---------- Horarios ----------

function HoursSection({ on401 }: { on401: (error: unknown) => boolean }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [newSlot, setNewSlot] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  if (!settings) {
    return <p className="py-8 text-center text-ink/50">Cargando horarios…</p>;
  }

  function addSlot() {
    if (!newSlot || !settings) return;
    if (!settings.timeSlots.includes(newSlot)) {
      setSettings({ ...settings, timeSlots: [...settings.timeSlots, newSlot].sort() });
    }
    setNewSlot("");
    setSaved(false);
  }

  function removeSlot(slot: string) {
    if (!settings) return;
    setSettings({ ...settings, timeSlots: settings.timeSlots.filter((s) => s !== slot) });
    setSaved(false);
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setFieldErrors({});
    try {
      const updated = await updateSettings(settings);
      setSettings(updated);
      setSaved(true);
    } catch (error) {
      if (!on401(error) && error instanceof ApiError && error.fields) {
        setFieldErrors(error.fields);
      }
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "rounded-md border border-azulejo-soft bg-white px-3 py-2 text-sm focus:border-azulejo focus:outline-2 focus:outline-offset-2 focus:outline-saffron";

  return (
    <section>
      <h2 className="font-display text-xl font-semibold italic text-azulejo">Horarios</h2>
      <p className="mt-1 text-sm text-ink/60">
        Los turnos que pueden elegirse al reservar. Los cambios se aplican al guardar.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {settings.timeSlots.map((slot) => (
          <span
            key={slot}
            className="inline-flex items-center gap-1.5 rounded-full border border-azulejo-soft bg-white px-3 py-1 text-sm"
          >
            {slot}
            <button
              onClick={() => removeSlot(slot)}
              aria-label={`Quitar ${slot}`}
              className="text-ink/40 hover:text-red-700"
            >
              ×
            </button>
          </span>
        ))}
        {settings.timeSlots.length === 0 && (
          <p className="text-sm text-red-700">Sin horarios — nadie podrá reservar.</p>
        )}
      </div>
      <FieldError messages={fieldErrors.timeSlots} />

      <div className="mt-3 flex items-end gap-2">
        <div>
          <label htmlFor="new-slot" className="text-sm font-medium">
            Nuevo turno
          </label>
          <input
            id="new-slot"
            type="time"
            step="1800"
            className={`${inputClass} mt-1 block`}
            value={newSlot}
            onChange={(e) => setNewSlot(e.target.value)}
          />
        </div>
        <button
          onClick={addSlot}
          className="rounded-md border border-azulejo-soft px-4 py-2 text-sm text-ink/70 hover:border-azulejo hover:text-azulejo"
        >
          Añadir
        </button>
      </div>

      <div className="mt-4">
        <label htmlFor="max-party" className="text-sm font-medium">
          Máximo de personas por reserva
        </label>
        <input
          id="max-party"
          type="number"
          min="1"
          max="20"
          className={`${inputClass} mt-1 block w-24`}
          value={settings.maxPartySize}
          onChange={(e) => {
            setSettings({ ...settings, maxPartySize: Number(e.target.value) });
            setSaved(false);
          }}
        />
        <FieldError messages={fieldErrors.maxPartySize} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-azulejo px-4 py-2 text-sm font-medium text-white hover:bg-azulejo/90 disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar horarios"}
        </button>
        {saved && <span className="text-sm text-azulejo">Guardado ✓</span>}
      </div>
    </section>
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
