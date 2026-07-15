import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";
import { EngineStatus } from "@/components/EngineStatus";

describe("HomePage content (readable without Canvas)", () => {
  it("renders a single h1 and the critical text/CTAs server-side", () => {
    const { container } = render(<HomePage />);

    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(/Vente Site Engine/);

    // Primary navigation CTAs are real links, reachable without any scene.
    expect(screen.getByRole("link", { name: /laboratoire/i })).toHaveAttribute("href", "/lab");
    expect(screen.getByRole("link", { name: /Commandes/i })).toHaveAttribute("href", "#commands");

    // Content does not depend on WebGL: no <canvas> is required to read the page.
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("lists the engine commands as visible content", () => {
    render(<HomePage />);
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
