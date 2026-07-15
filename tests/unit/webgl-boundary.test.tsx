import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WebGLBoundary } from "@/components/three/WebGLBoundary";
import { detectWebGL } from "@/lib/three/webgl";

vi.mock("@/lib/three/webgl", () => ({
  detectWebGL: vi.fn(),
}));

const mockedDetectWebGL = vi.mocked(detectWebGL);

/** A stand-in "scene" — asserting it never renders proves the fallback path. */
function FakeScene() {
  return <div data-testid="scene">WebGL scene</div>;
}

beforeEach(() => {
  mockedDetectWebGL.mockReset();
});

describe("WebGLBoundary", () => {
  it("renders the accessible fallback (not the scene) when forceFallback is set", () => {
    mockedDetectWebGL.mockReturnValue(true);
    render(
      <WebGLBoundary forceFallback fallback={{ alt: "Aperçu de la salle de montre" }}>
        <FakeScene />
      </WebGLBoundary>,
    );

    expect(screen.getByRole("img", { name: "Aperçu de la salle de montre" })).toBeInTheDocument();
    expect(screen.queryByTestId("scene")).not.toBeInTheDocument();
  });

  it("renders the fallback when WebGL is unavailable", () => {
    mockedDetectWebGL.mockReturnValue(false);
    render(
      <WebGLBoundary fallback={{ alt: "Photo du produit" }}>
        <FakeScene />
      </WebGLBoundary>,
    );

    expect(screen.getByRole("img", { name: "Photo du produit" })).toBeInTheDocument();
    expect(screen.queryByTestId("scene")).not.toBeInTheDocument();
  });

  it("uses a default alt when none is provided, keeping content readable without Canvas", () => {
    mockedDetectWebGL.mockReturnValue(false);
    render(
      <WebGLBoundary>
        <FakeScene />
      </WebGLBoundary>,
    );

    expect(screen.getByRole("img", { name: "Aperçu visuel" })).toBeInTheDocument();
  });

  it("renders the WebGL scene when WebGL is available and not forced to fallback", () => {
    mockedDetectWebGL.mockReturnValue(true);
    render(
      <WebGLBoundary fallback={{ alt: "Photo du produit" }}>
        <FakeScene />
      </WebGLBoundary>,
    );

    expect(screen.getByTestId("scene")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Photo du produit" })).not.toBeInTheDocument();
  });
});
