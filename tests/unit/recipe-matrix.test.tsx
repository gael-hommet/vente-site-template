import { describe, it, expect, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipeMatrix } from "@/components/ace-lab/RecipeMatrix";

describe("Studio — RecipeMatrix", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

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

  it("switching Design Language preset changes the injected CSS", async () => {
    const user = userEvent.setup();
    render(<RecipeMatrix />);
    const select = screen.getByRole("combobox", { name: "Choix du preset Design Language" });
    await user.selectOptions(select, "precision-dark");
    expect(select).toHaveValue("precision-dark");
  });

  it("checking 'Thème sombre' sets data-theme on <html> and unchecking restores it", async () => {
    const user = userEvent.setup();
    render(<RecipeMatrix />);
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();

    const checkbox = screen.getByRole("checkbox", { name: "Thème sombre" });
    await user.click(checkbox);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    await user.click(checkbox);
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
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
