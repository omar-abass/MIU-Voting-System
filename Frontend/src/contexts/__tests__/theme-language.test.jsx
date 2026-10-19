import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  LanguageToggle,
  ThemeToggle,
} from "../../components/common/Toggles.jsx";
import { renderPlain, resetEnvironment, i18n } from "../../test/utils.jsx";

function Harness() {
  return (
    <>
      <ThemeToggle />
      <LanguageToggle />
      <h1>{i18n.t("app.name")}</h1>
    </>
  );
}

describe("theme and language switching", () => {
  beforeEach(async () => {
    await resetEnvironment();
  });

  it("starts in light mode, English and left-to-right", () => {
    renderPlain(<Harness />);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });

  it("toggles dark mode, updates data-theme and remembers the choice", async () => {
    const user = userEvent.setup();
    renderPlain(<Harness />);
    await user.click(
      screen.getByRole("button", { name: /switch to dark mode/i }),
    );
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("miu-theme")).toBe("dark");
    // the button now offers the opposite action and reports its pressed state
    const toggle = screen.getByRole("button", {
      name: /switch to light mode/i,
    });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await user.click(toggle);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem("miu-theme")).toBe("light");
  });

  it("restores a stored dark theme on start", () => {
    localStorage.setItem("miu-theme", "dark");
    renderPlain(<Harness />);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("switches to Arabic: html lang/dir become ar/rtl, text is translated and the choice is saved", async () => {
    const user = userEvent.setup();
    renderPlain(<Harness />);
    await user.click(screen.getByRole("button", { name: /switch language/i }));
    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("dir", "rtl"),
    );
    expect(document.documentElement).toHaveAttribute("lang", "ar");
    expect(localStorage.getItem("miu-lang")).toBe("ar");
    expect(i18n.language).toBe("ar");
    // the toggle now offers English
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("switches back to English and returns to ltr", async () => {
    const user = userEvent.setup();
    renderPlain(<Harness />);
    await user.click(screen.getByRole("button", { name: /switch language/i }));
    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("dir", "rtl"),
    );
    await user.click(screen.getByText("English").closest("button"));
    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("dir", "ltr"),
    );
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(localStorage.getItem("miu-lang")).toBe("en");
  });
});
