import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EnginePage from "@/app/engine/page";
import { EngineStatus } from "@/components/EngineStatus";

/**
 * Tests du tableau de bord interne du moteur (`/engine`, `EngineStatus`).
 * Ce fichier est EXCLU des sites générés (voir ENGINE_ONLY_TESTS dans
 * scripts/ace/new-site.mjs) — comme les routes/composants qu'il teste, il
 * n'a aucun sens hors du dépôt moteur.
 */

describe("EnginePage (internal dashboard, /engine)", () => {
  it("renders the dashboard with commands", () => {
    render(<EnginePage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("/build-site")).toBeInTheDocument();
    expect(screen.getByText("/audit-site")).toBeInTheDocument();
  });
});

describe("EngineStatus", () => {
  it("renders capability rows without requiring WebGL", () => {
    render(<EngineStatus />);
    expect(screen.getByText("WebGL")).toBeInTheDocument();
    expect(screen.getByText("Reduced motion")).toBeInTheDocument();
    // Default store state is undetected → LITE / fallback, never crashes.
    expect(screen.getByText(/indisponible/)).toBeInTheDocument();
  });
});
