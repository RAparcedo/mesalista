import type { Dish } from "../types";
import { formatPrice } from "../lib/format";

// One line of the carta: name ……… price, description underneath.
export function DishRow({ dish }: { dish: Dish }) {
  return (
    <li className="py-3">
      <div className="flex items-baseline gap-2">
        <h3 className="font-medium text-ink">{dish.name}</h3>
        <span aria-hidden className="mb-1 flex-1 border-b border-dotted border-ink/30" />
        <span className="font-display font-semibold text-azulejo">
          {formatPrice(dish.price)}
        </span>
      </div>
      <p className="mt-0.5 max-w-prose text-sm text-ink/60">{dish.description}</p>
    </li>
  );
}
