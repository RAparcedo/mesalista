import type { Category } from "../types";
import { DishRow } from "./DishRow";

export function CategorySection({ category }: { category: Category }) {
  return (
    <section id={`categoria-${category.id}`} className="scroll-mt-24">
      <h2 className="font-display text-2xl font-semibold italic text-azulejo">
        {category.name}
      </h2>
      <ul className="mt-2 divide-y divide-azulejo-soft">
        {category.dishes.map((dish) => (
          <DishRow key={dish.id} dish={dish} />
        ))}
      </ul>
    </section>
  );
}
