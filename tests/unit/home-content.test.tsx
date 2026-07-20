import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";
import { TO_CONFIRM_MARK } from "@/ace/content";

describe("Starter HomePage (readable without Canvas)", () => {
  it("renders a single h1 and the critical CTAs server-side", () => {
    render(<HomePage />);

    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(/Votre promesse/);

    // Conversion paths are plain links, reachable without any scene.
    expect(screen.getAllByRole("link", { name: /Demander un devis/i })[0]).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(screen.getByRole("link", { name: /Découvrir l'offre/i })).toHaveAttribute(
      "href",
      "/offre",
    );
  });

  it("marks every unverified fact with the visible [À CONFIRMER] flag", () => {
    render(<HomePage />);
    // Proof strip: 4 facts + FAQ answers (3) all unconfirmed in the starter.
    const marks = screen.getAllByText(new RegExp(TO_CONFIRM_MARK.replace(/[[\]]/g, "\\$&")));
    expect(marks.length).toBeGreaterThanOrEqual(4);
  });

  it("contains no fabricated figures, prices or reviews", () => {
    const { container } = render(<HomePage />);
    // No euro amount or percentage appears anywhere in the starter home.
    expect(container.textContent).not.toMatch(/\d+\s?€|\d+\s?%|[45][.,]\d\/5/);
  });
});
