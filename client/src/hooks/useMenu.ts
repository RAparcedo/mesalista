import { useEffect, useState } from "react";
import { getMenu } from "../api/menu";
import type { Category } from "../types";

// Loads the menu once and exposes the three UI states plus a retry.
export function useMenu() {
  const [menu, setMenu] = useState<Category[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");

  function fetchMenu() {
    setStatus("loading");
    getMenu()
      .then((categories) => {
        setMenu(categories);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(fetchMenu, []);

  return { menu, status, retry: fetchMenu };
}
