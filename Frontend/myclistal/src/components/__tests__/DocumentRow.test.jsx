// src/components/__tests__/DocumentRow.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DocumentRow from "../DocumentRow";
import "@testing-library/jest-dom";

const sampleDoc = {
  _id: "abc123",
  name: "Test_File.pdf",
  type: "PDF",
  size: "1.2 MB",
  status: "Approved",
  uploadedDate: new Date("2024-04-15").toISOString(),
  uploadedBy: { email: "me@example.com" },
};

describe("DocumentRow", () => {
  it("renders document details", () => {
    render(<table><tbody><DocumentRow doc={sampleDoc} /></tbody></table>);
    expect(screen.getByText("Test_File.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("1.2 MB")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("calls preview handler if provided", () => {
    const onPreview = jest.fn();
    render(<table><tbody><DocumentRow doc={sampleDoc} onPreview={onPreview} /></tbody></table>);
    fireEvent.click(screen.getByLabelText("Preview"));
    expect(onPreview).toHaveBeenCalledWith(sampleDoc);
  });

  it("has accessible buttons", () => {
    render(<table><tbody><DocumentRow doc={sampleDoc} /></tbody></table>);
    expect(screen.getByLabelText("Preview")).toBeInTheDocument();
    expect(screen.getByLabelText("Download")).toBeInTheDocument();
  });
});
