/** Development-only browser harness for saved generations and bounded canvas checks. */
import React from "react";
import { createRoot } from "react-dom/client";
import SimulationCanvas from "../components/SimulationCanvas";
import { playgrounds } from "../simulations/playgroundCatalog";
import "../index.css";
const samples = import.meta.glob("../artifacts/generations/*.jsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const sources = [
  ...playgrounds.map((p) => ({
    id: p.id,
    title: p.title,
    code: `render(<PlaygroundSimulation id="${p.id}" />);`,
  })),
  ...Object.entries(samples).map(([path, code]) => ({
    id: `generated-${path.split("/").at(-1)!.replace(".jsx", "")}`,
    title: `Generated: ${path.split("/").at(-1)}`,
    code,
  })),
];
function Lab() {
  const [id, setId] = React.useState(
    new URLSearchParams(location.search).get("sample") || "bits",
  );
  const [size, setSize] = React.useState("600 × 420");
  const [error, setError] = React.useState("");
  const source = sources.find((p) => p.id === id) ?? sources[0];
  return (
    <>
      <header
        style={{
          display: "flex",
          gap: 20,
          padding: 12,
          alignItems: "center",
          height: 55,
        }}
      >
        <label>
          Material{" "}
          <select
            aria-label="Material"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setError("");
            }}
          >
            {sources.map((p) => (
              <option key={p.title} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Canvas{" "}
          <select
            aria-label="Canvas size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            <option>600 × 420</option>
            <option>960 × 600</option>
            <option>360 × 560</option>
          </select>
        </label>
        <span role="status">{error || "Ready"}</span>
      </header>
      <main
        style={{
          width: Number(size.split(" × ")[0]),
          height: Number(size.split(" × ")[1]),
          margin: 12,
          border: "1px solid #ddd",
        }}
      >
        <SimulationCanvas
          key={source.id}
          code={source.code}
          isCached
          showToolbar={false}
          onError={setError}
        />
      </main>
    </>
  );
}
if (import.meta.env.DEV)
  createRoot(document.getElementById("root")!).render(<Lab />);
