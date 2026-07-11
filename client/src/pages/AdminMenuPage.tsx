import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { createDish, deleteDish, listDishes, updateDish } from "../api/dishes";
import type { DishInput } from "../api/dishes";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../lib/format";
import type { Category, Dish } from "../types";
import { ErrorMessage } from "../components/ErrorMessage";

// What the inline form is currently doing: creating a dish in a category,
// or editing an existing one.
type Editing = { mode: "new"; categoryId: number } | { mode: "edit"; dish: Dish } | null;

export function AdminMenuPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [editing, setEditing] = useState<Editing>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

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

  const reload = useCallback(() => {
    listDishes()
      .then((rows) => {
        setCategories(rows);
        setStatus("success");
      })
      .catch((error) => {
        if (!handle401(error)) setStatus("error");
      });
  }, [handle401]);

  useEffect(() => {
    setStatus("loading");
    reload();
  }, [reload]);

  async function toggleAvailability(dish: Dish) {
    setBusyId(dish.id);
    try {
      await updateDish(dish.id, { isAvailable: !dish.isAvailable });
      reload();
    } catch (error) {
      handle401(error);
    } finally {
      setBusyId(null);
    }
  }

  async function removeDish(dish: Dish) {
    if (!window.confirm(`¿Borrar "${dish.name}" definitivamente?`)) return;
    setBusyId(dish.id);
    try {
      await deleteDish(dish.id);
      reload();
    } catch (error) {
      handle401(error);
    } finally {
      setBusyId(null);
    }
  }

  if (status === "loading") {
    return <p className="py-12 text-center text-ink/50">Cargando…</p>;
  }

  if (status === "error") {
    return <ErrorMessage message="No hemos podido cargar la carta." onRetry={reload} />;
  }

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <section key={category.id}>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold italic text-azulejo">
              {category.name}
            </h2>
            <button
              onClick={() => setEditing({ mode: "new", categoryId: category.id })}
              className="text-sm font-medium text-azulejo hover:underline"
            >
              + Añadir plato
            </button>
          </div>

          {editing?.mode === "new" && editing.categoryId === category.id && (
            <DishForm
              categories={categories}
              initial={{ name: "", description: "", price: 0, categoryId: category.id }}
              onSaved={() => {
                setEditing(null);
                reload();
              }}
              onCancel={() => setEditing(null)}
              on401={handle401}
            />
          )}

          <ul className="mt-2 divide-y divide-azulejo-soft">
            {category.dishes.map((dish) =>
              editing?.mode === "edit" && editing.dish.id === dish.id ? (
                <li key={dish.id} className="py-3">
                  <DishForm
                    categories={categories}
                    dishId={dish.id}
                    initial={{
                      name: dish.name,
                      description: dish.description,
                      price: Number(dish.price),
                      categoryId: dish.categoryId,
                    }}
                    onSaved={() => {
                      setEditing(null);
                      reload();
                    }}
                    onCancel={() => setEditing(null)}
                    on401={handle401}
                  />
                </li>
              ) : (
                <li key={dish.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className={dish.isAvailable ? "" : "opacity-50"}>
                    <p className="font-medium">
                      {dish.name}{" "}
                      <span className="font-display font-semibold text-azulejo">
                        {formatPrice(dish.price)}
                      </span>
                      {!dish.isAvailable && (
                        <span className="ml-2 rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/50">
                          Oculto
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-ink/60">{dish.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAvailability(dish)}
                      disabled={busyId === dish.id}
                      className="rounded-md border border-azulejo-soft px-3 py-1.5 text-sm text-ink/70 hover:border-azulejo hover:text-azulejo disabled:opacity-60"
                    >
                      {dish.isAvailable ? "Ocultar" : "Mostrar"}
                    </button>
                    <button
                      onClick={() => setEditing({ mode: "edit", dish })}
                      disabled={busyId === dish.id}
                      className="rounded-md border border-azulejo-soft px-3 py-1.5 text-sm text-ink/70 hover:border-azulejo hover:text-azulejo disabled:opacity-60"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => removeDish(dish)}
                      disabled={busyId === dish.id}
                      className="rounded-md border border-azulejo-soft px-3 py-1.5 text-sm text-ink/70 hover:border-red-300 hover:text-red-700 disabled:opacity-60"
                    >
                      Borrar
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}

// Inline form used both to create (no dishId) and to edit (dishId set).
function DishForm({
  categories,
  dishId,
  initial,
  onSaved,
  onCancel,
  on401,
}: {
  categories: Category[];
  dishId?: number;
  initial: DishInput;
  onSaved: () => void;
  onCancel: () => void;
  on401: (error: unknown) => boolean;
}) {
  const [form, setForm] = useState<DishInput>(initial);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      if (dishId === undefined) {
        await createDish(form);
      } else {
        await updateDish(dishId, form);
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
          <label htmlFor="dish-name" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="dish-name"
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <FieldError messages={fieldErrors.name} />
        </div>
        <div>
          <label htmlFor="dish-price" className="text-sm font-medium">
            Precio (€)
          </label>
          <input
            id="dish-price"
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            value={form.price === 0 ? "" : form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            required
          />
          <FieldError messages={fieldErrors.price} />
        </div>
      </div>

      <div>
        <label htmlFor="dish-description" className="text-sm font-medium">
          Descripción
        </label>
        <input
          id="dish-description"
          className={inputClass}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <FieldError messages={fieldErrors.description} />
      </div>

      <div>
        <label htmlFor="dish-category" className="text-sm font-medium">
          Categoría
        </label>
        <select
          id="dish-category"
          className={inputClass}
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <FieldError messages={fieldErrors.categoryId} />
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

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <p role="alert" className="mt-1 text-sm text-red-700">
      {messages[0]}
    </p>
  );
}
