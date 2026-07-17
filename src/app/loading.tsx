import { LoadingState } from "@/components/ui/states";

/** Route-level loading UI (App Router). Dimensioned to avoid layout shift. */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingState label="Chargement de la page…" />
    </div>
  );
}
