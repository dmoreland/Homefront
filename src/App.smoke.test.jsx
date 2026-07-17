import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./App.jsx";

// Renders the full composed component tree (initial render, no effects) to
// confirm every module wires up and the hook's initial state simulates cleanly.
describe("App smoke render", () => {
  it("renders the header and all major sections without throwing", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("HOME FRONT");
    expect(html).toContain("Industry");
    expect(html).toContain("Military Production");
    expect(html).toContain("His Majesty&#x27;s Forces");
    expect(html).toContain("Theatres of War");
    expect(html).toContain("War Cabinet");
    expect(html).toContain("WORK THE FOUNDRY");
    // Resource strip shows the passive manpower trickle net rate (+0.5/s).
    expect(html).toContain("WORK THE FOUNDRY (+2 steel)");
  });
});
