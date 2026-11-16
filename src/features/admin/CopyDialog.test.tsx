import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CopyDialog from "./CopyDialog";

describe("CopyDialog", () => {
  it("copies a recipe under a new name", () => {
    const onCopy = vi.fn();
    render(
      <CopyDialog
        isOpen
        title="Copy “Sinigang na Hipon”"
        initialName="Sinigang na Hipon (copy)"
        isSaving={false}
        onClose={() => {}}
        onCopy={onCopy}
      />,
    );

    fireEvent.change(screen.getByLabelText("Name of the copy"), {
      target: { value: "  Sinigang na Hipon 1/2 " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Make copy" }));

    expect(onCopy).toHaveBeenCalledWith("Sinigang na Hipon 1/2", undefined);
  });

  it("needs a stall before copying a dish, then sends it", () => {
    const onCopy = vi.fn();
    render(
      <CopyDialog
        isOpen
        title="Copy dish"
        initialName="Sinigang na Hipon"
        targets={[
          { id: 1, label: "Stall 1 (this stall)" },
          { id: 2, label: "Stall 2" },
        ]}
        targetLabel="Copy to stall"
        isSaving={false}
        onClose={() => {}}
        onCopy={onCopy}
      />,
    );

    const button = screen.getByRole("button", { name: "Make copy" });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Copy to stall"), { target: { value: "2" } });
    expect(button).toBeEnabled();
    fireEvent.click(button);

    expect(onCopy).toHaveBeenCalledWith("Sinigang na Hipon", 2);
  });

  it("won't copy with an empty name", () => {
    render(
      <CopyDialog
        isOpen
        title="Copy"
        initialName="X"
        isSaving={false}
        onClose={() => {}}
        onCopy={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Name of the copy"), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Make copy" })).toBeDisabled();
  });
});
