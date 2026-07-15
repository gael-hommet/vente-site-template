import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CallCTA, DirectionsCTA, StickyMobileCTA } from "@/components/conversion/ctas";
import { track } from "@/lib/analytics/track";

vi.mock("@/lib/analytics/track", () => ({
  track: vi.fn(),
}));

const mockedTrack = vi.mocked(track);

beforeEach(() => {
  mockedTrack.mockReset();
});

describe("CallCTA", () => {
  it("renders a keyboard-reachable tel: link with an accessible name", () => {
    render(<CallCTA phone="+33 1 23 45 67 89" label="Appeler" />);
    const link = screen.getByRole("link", { name: /Appeler/ });
    expect(link).toHaveAttribute("href", "tel:+33123456789");
  });

  it("tracks phone_clicked when activated", async () => {
    const user = userEvent.setup();
    render(<CallCTA phone="+33 1 23 45 67 89" />);
    await user.click(screen.getByRole("link"));
    expect(mockedTrack).toHaveBeenCalledWith("phone_clicked", { phone: "+33 1 23 45 67 89" });
  });
});

describe("DirectionsCTA", () => {
  it("builds a maps directions link from coordinates", () => {
    render(<DirectionsCTA lat={48.8566} lng={2.3522} />);
    const link = screen.getByRole("link", { name: /Itinéraire/ });
    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=48.8566,2.3522",
    );
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("falls back to a maps search link when only a query is provided", () => {
    render(<DirectionsCTA query="Garage Central Paris" />);
    const link = screen.getByRole("link", { name: /Itinéraire/ });
    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Garage%20Central%20Paris",
    );
  });
});

describe("StickyMobileCTA", () => {
  it("keeps the primary conversion reachable as a link, independent of any scene", () => {
    render(<StickyMobileCTA phone="+33 1 23 45 67 89" primaryLabel="Devis gratuit" />);
    const primary = screen.getByRole("link", { name: "Devis gratuit" });
    expect(primary).toHaveAttribute("href", "#contact");
    // The call CTA is also present in the sticky bar.
    const links = screen.getAllByRole("link");
    expect(links.some((el) => el.getAttribute("href") === "tel:+33123456789")).toBe(true);
  });
});
