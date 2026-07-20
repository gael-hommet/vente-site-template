import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipeMatrix } from "@/components/ace-lab/RecipeMatrix";
import { PresetPreview } from "@/components/ace-lab/PresetPreview";

describe("Studio — RecipeMatrix", () => {
  it("renders every hero recipe by default with distinct DOM", () => {
    render(<RecipeMatrix />);
    expect(screen.getByText("typographic")).toBeInTheDocument();
    expect(screen.getByText("media-first")).toBeInTheDocument();
    expect(screen.getByText("split-narrative")).toBeInTheDocument();
  });

  it("switches family and renders that family's recipes", async () => {
    const user = userEvent.setup();
    render(<RecipeMatrix />);
    await user.click(screen.getByRole("button", { name: /Navigation \(/ }));
    expect(screen.getByText("minimal-header")).toBeInTheDocument();
    expect(screen.getByText("editorial-folio")).toBeInTheDocument();
    expect(screen.queryByText("typographic")).not.toBeInTheDocument();
  });

  it("switching Design Language preset scopes CSS to [data-recipe-matrix], never :root", async () => {
    const user = userEvent.setup();
    const { container } = render(<RecipeMatrix />);
    const select = screen.getByRole("combobox", { name: "Choix du preset Design Language" });
    await user.selectOptions(select, "precision-dark");
    expect(select).toHaveValue("precision-dark");

    const style = container.querySelector("style[data-ace-studio-preset]");
    expect(style?.textContent).toContain("[data-recipe-matrix]");
    expect(style?.textContent).not.toMatch(/(?<!\[data-recipe-matrix\])\s*:root/);
  });

  it("does not fight PresetPreview's global :root switcher when both are mounted", async () => {
    const user = userEvent.setup();
    render(
      <>
        <PresetPreview />
        <RecipeMatrix />
      </>,
    );
    const globalGroup = screen.getByRole("group", { name: "Choix du preset" });
    await user.click(within(globalGroup).getByRole("button", { name: "Onyx" }));
    expect(within(globalGroup).getByRole("button", { name: "Onyx" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const brand = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim();
    // Onyx's brand token — RecipeMatrix (rendered after, defaulting to
    // "neutral") must not have overridden :root and reverted this.
    expect(brand).toBe("oklch(0.68 0.11 85)");
  });

  it("checking 'Thème sombre' sets data-theme on the scoped wrapper only (not <html>)", async () => {
    const user = userEvent.setup();
    const { container } = render(<RecipeMatrix />);
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();

    const checkbox = screen.getByRole("checkbox", { name: "Thème sombre" });
    await user.click(checkbox);
    const scoped = container.querySelector("[data-recipe-matrix]");
    expect(scoped).toHaveAttribute("data-theme", "dark");
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();

    await user.click(checkbox);
    expect(container.querySelector("[data-recipe-matrix]")).not.toHaveAttribute("data-theme");
  });

  it("switching viewport does not crash and keeps recipes rendered", async () => {
    const user = userEvent.setup();
    render(<RecipeMatrix />);
    await user.click(screen.getByRole("button", { name: "Mobile" }));
    expect(screen.getByText("typographic")).toBeInTheDocument();
  });

  it("lists motion and scene profiles", () => {
    render(<RecipeMatrix />);
    const motion = screen.getByText(/Profils Motion/).closest("div")!;
    expect(within(motion).getByText("restrained")).toBeInTheDocument();
    const scene = screen.getByText(/Profils Scene/).closest("div")!;
    expect(within(scene).getByText("no-scene")).toBeInTheDocument();
  });
});
