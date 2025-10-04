// src/components/__tests__/StatusBadge.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import StatusBadge from "../StatusBadge";
import "@testing-library/jest-dom";

describe("StatusBadge", () => {
  it("renders status text and has data-testid", () => {
    render(<StatusBadge status="Approved" />);
    const el = screen.getByTestId("status-badge");
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent("Approved");
  });

  it("falls back to default style when unknown status", () => {
    render(<StatusBadge status="SOMETHING" />);
    const el = screen.getByTestId("status-badge");
    expect(el).toHaveTextContent("SOMETHING");
  });
});
