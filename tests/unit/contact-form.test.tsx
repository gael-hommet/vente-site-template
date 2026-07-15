import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "@/components/conversion/ContactForm";
import { submitForm } from "@/lib/forms/submit";

// Mock the network deliver module so no fetch happens; assert the form drives it.
vi.mock("@/lib/forms/submit", () => ({
  submitForm: vi.fn(),
}));
// Silence analytics side effects.
vi.mock("@/lib/analytics/track", () => ({ track: vi.fn() }));

const mockedSubmit = vi.mocked(submitForm);

beforeEach(() => {
  mockedSubmit.mockReset();
});

describe("ContactForm", () => {
  it("renders accessible, labelled fields", () => {
    render(<ContactForm />);
    expect(screen.getByRole("textbox", { name: /Nom/ })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Email/ })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Message/ })).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("shows validation errors on empty submit and does not call the network", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole("button", { name: /Envoyer/ }));

    expect(await screen.findByText("Nom trop court")).toBeInTheDocument();
    expect(screen.getByText("Email invalide")).toBeInTheDocument();
    expect(screen.getByText("Message trop court")).toBeInTheDocument();
    expect(screen.getByText("Consentement requis")).toBeInTheDocument();
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it("submits valid data and shows a success status", async () => {
    mockedSubmit.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByRole("textbox", { name: /Nom/ }), "Marie Martin");
    await user.type(screen.getByRole("textbox", { name: /Email/ }), "marie@example.com");
    await user.type(
      screen.getByRole("textbox", { name: /Message/ }),
      "Bonjour, je souhaite plus d'informations sur vos services.",
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Envoyer/ }));

    expect(await screen.findByRole("status")).toHaveTextContent("Message envoyé");
    expect(mockedSubmit).toHaveBeenCalledTimes(1);
    expect(mockedSubmit).toHaveBeenCalledWith(
      "contact",
      expect.objectContaining({
        name: "Marie Martin",
        email: "marie@example.com",
        consent: true,
      }),
    );
  });

  it("shows a server error alert when the delivery fails", async () => {
    mockedSubmit.mockResolvedValue({ ok: false });
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByRole("textbox", { name: /Nom/ }), "Marie Martin");
    await user.type(screen.getByRole("textbox", { name: /Email/ }), "marie@example.com");
    await user.type(
      screen.getByRole("textbox", { name: /Message/ }),
      "Un message suffisamment long pour valider.",
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Envoyer/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Envoi impossible/);
  });
});
