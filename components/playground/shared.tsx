import React from "react";
import { SimFrame } from "../SimSDK";
import { ModelNotes } from "../../simulations/playback";
import { useSimulationSnapshot } from "../../simulations/observation";
import {
  PlaygroundId,
  playgroundById,
} from "../../simulations/playgroundCatalog";

export function useMaterial<S>(initial: S) {
  const [history, setHistory] = React.useState([initial]);
  const state = history[history.length - 1];
  return {
    state,
    change: (next: S | ((s: S) => S)) =>
      setHistory((h) => [
        ...h.slice(-49),
        typeof next === "function"
          ? (next as (s: S) => S)(h[h.length - 1])
          : next,
      ]),
    undo: () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h)),
    reset: () => setHistory([initial]),
    recentActions: history
      .slice(-8)
      .flatMap((entry) =>
        entry && typeof entry === "object" && "message" in entry
          ? [String(entry.message)]
          : [],
      ),
    canUndo: history.length > 1,
  };
}
export type Material<S> = ReturnType<typeof useMaterial<S>>;
export function Workbench<S>({
  id,
  model,
  assumptions,
  children,
  readings,
}: {
  id: PlaygroundId;
  model: Material<S>;
  assumptions: string;
  children: React.ReactNode;
  readings?: React.ReactNode;
}) {
  const info = playgroundById[id];
  useSimulationSnapshot({
    title: info.title,
    assumptions,
    state: model.state,
    recentActions: model.recentActions,
    invitation: info.invitation,
  });
  return (
    <SimFrame title={info.title} description={info.invitation} stats={readings}>
      <div className="play-workbench">
        <p className="play-invitation">{info.invitation}</p>
        <div className="play-surface">{children}</div>
        <div className="play-footer">
          <div className="play-actions">
            <button onClick={model.undo} disabled={!model.canUndo}>
              Undo
            </button>
            <button onClick={model.reset}>Reset</button>
          </div>
          <ModelNotes>{assumptions}</ModelNotes>
        </div>
      </div>
    </SimFrame>
  );
}
export const Feedback = ({ children }: { children: React.ReactNode }) => (
  <p className="play-feedback" role="status">
    {children}
  </p>
);
export function Choices<T extends string>({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="play-choices" role="group" aria-label={label}>
      {values.map((option) => (
        <button
          key={option}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
