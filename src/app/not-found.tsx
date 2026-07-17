import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

/** 404 — designed, branded via tokens, with a clear way back. */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-5 px-5 text-center">
      <Compass className="text-muted size-10" aria-hidden />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Page introuvable</h1>
        <p className="text-muted mt-2 max-w-sm text-sm">
          L&apos;adresse demandée n&apos;existe pas ou plus. Le contenu que vous cherchez se trouve
          peut-être depuis l&apos;accueil.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">Nous contacter</Link>
        </Button>
      </div>
    </div>
  );
}
