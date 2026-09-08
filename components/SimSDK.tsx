import React from "react";
import { Info, SlidersHorizontal, X } from "lucide-react";
import { CanvasFit } from "./CanvasFit";

interface SimFrameProps {
  compact?: boolean;
  title: string;
  description: string;
  controls?: React.ReactNode;
  stats?: React.ReactNode;
  children: React.ReactNode;
}

export const SimFrame: React.FC<SimFrameProps> = ({
  title,
  compact = false,
  description,
  controls,
  stats,
  children,
}) => {
  const [panel, setPanel] = React.useState<"controls" | "about" | null>(null);
  const frame = React.useRef<HTMLDivElement>(null);
  const trigger = React.useRef<HTMLButtonElement | null>(null);
  const panelId = React.useId();
  React.useEffect(() => {
    if (!panel) return;
    const dismiss = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanel(null);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [panel]);
  const toggle = (
    next: "controls" | "about",
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    trigger.current = event.currentTarget;
    setPanel((previous) => (previous === next ? null : next));
  };
  return (
    <div
      className={`sim-frame${compact ? " sim-frame--compact" : ""}`}
      ref={frame}
    >
      <header className="sim-frame-header">
        <h2 title={title}>{title}</h2>
        <div className="sim-frame-actions">
          <button
            type="button"
            onClick={(e) => toggle("about", e)}
            aria-label="About this model"
            aria-expanded={panel === "about"}
          >
            <Info size={15} />
          </button>
          {controls && (
            <button
              type="button"
              onClick={(e) => toggle("controls", e)}
              aria-expanded={panel === "controls"}
              aria-controls={panelId}
            >
              <SlidersHorizontal size={14} /> Adjust
            </button>
          )}
        </div>
      </header>
      <div className="sim-stage">
        <CanvasFit>{children}</CanvasFit>
      </div>
      {stats && (
        <div className="sim-readouts" aria-label="Model readings">
          {stats}
        </div>
      )}
      {panel && (
        <>
          <button
            className="sim-inspector-dismiss"
            aria-label="Close model panel"
            onClick={() => setPanel(null)}
          />
          <section
            className="sim-inspector"
            role="dialog"
            aria-label={
              panel === "controls" ? "Model parameters" : "About this model"
            }
            id={panelId}
          >
            <header>
              <span>
                {panel === "controls" ? "Parameters" : "About this model"}
              </span>
              <button
                type="button"
                aria-label="Close model panel"
                onClick={() => {
                  setPanel(null);
                  trigger.current?.focus();
                }}
              >
                <X size={15} />
              </button>
            </header>
            <div className="sim-inspector-content">
              {panel === "controls" ? controls : <p>{description}</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

interface ControlProps {
  label: string;
  value?: string | number;
  children: React.ReactNode;
}
export const Control: React.FC<ControlProps> = ({ label, value, children }) => {
  const id = React.useId();
  const labelable =
    React.isValidElement<{ id?: string }>(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type);
  const controlId = labelable ? (children.props.id ?? id) : undefined;
  const control = labelable
    ? React.cloneElement(children, { id: controlId })
    : children;
  return (
    <div className="sim-control">
      <div className="sim-control-label">
        <label htmlFor={controlId}>{label}</label>
        {value !== undefined && <output>{value}</output>}
      </div>
      {control}
    </div>
  );
};
interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}
export const Stat: React.FC<StatProps> = ({
  label,
  value,
  unit,
  highlight,
}) => (
  <div className={`sim-stat ${highlight ? "is-highlighted" : ""}`}>
    <span>{label}</span>
    <strong>
      {value}
      {unit && <small>{unit}</small>}
    </strong>
  </div>
);
