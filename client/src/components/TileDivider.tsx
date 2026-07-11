// Small azulejo-inspired divider: line ◆ line. Purely decorative.
export function TileDivider() {
  return (
    <div aria-hidden className="mx-auto flex max-w-45 items-center gap-3">
      <span className="h-px flex-1 bg-azulejo/30" />
      <span className="rotate-45 border border-azulejo/50 bg-azulejo-soft p-0.75" />
      <span className="h-px flex-1 bg-azulejo/30" />
    </div>
  );
}
