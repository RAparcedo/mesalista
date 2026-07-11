interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div role="alert" className="rounded-lg border border-azulejo-soft bg-white p-6 text-center">
      <p className="text-ink">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-md bg-azulejo px-4 py-2 text-sm font-medium text-white hover:bg-azulejo/90 focus:outline-2 focus:outline-offset-2 focus:outline-saffron"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
