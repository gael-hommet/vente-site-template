/** Keyboard skip link. Renders first in <body> so Tab reaches it immediately. */
export function SkipLink({ targetId = "main" }: { targetId?: string }) {
  return (
    <a href={`#${targetId}`} className="skip-link">
      Aller au contenu principal
    </a>
  );
}
