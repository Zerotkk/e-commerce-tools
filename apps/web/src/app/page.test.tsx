import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("shows the internal product task app heading", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "E-commerce Tools" })).toBeTruthy();
  });
});
