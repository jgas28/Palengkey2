import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";

describe("ScrollToTop", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scrolls to top when the route changes", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/one"]}>
        <ScrollToTop />
        <Routes>
          <Route path="/one" element={<div>One</div>} />
          <Route path="/two" element={<div>Two</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
