import React from "react";

/** A deterministic trace: changing inputs resets to step zero; changing speed only changes playback. */
export function useSimulationTimeline<T>(frames: readonly T[]) {
  if (!Array.isArray(frames) || frames.length === 0 || frames.length > 5000) {
    throw new Error(
      "A simulation timeline requires between 1 and 5000 frames.",
    );
  }
  const [state, setState] = React.useState({
    frames,
    index: 0,
    playing: false,
  });
  const [speed, setSpeed] = React.useState(1);
  const current =
    state.frames === frames ? state : { frames, index: 0, playing: false };
  const last = Math.max(0, frames.length - 1);
  const index = Math.min(current.index, last);
  const seek = React.useCallback(
    (next: number) =>
      setState({
        frames,
        index: Math.max(0, Math.min(frames.length - 1, next)),
        playing: false,
      }),
    [frames],
  );
  const toggle = () =>
    setState({
      frames,
      index: index === last ? 0 : index,
      playing: !current.playing,
    });
  React.useEffect(() => {
    if (!current.playing || frames.length < 2) return;
    const timer = window.setInterval(() => {
      setState((previous) => {
        if (previous.frames !== frames) return previous;
        const next = Math.min(previous.index + 1, last);
        return { frames, index: next, playing: next < last };
      });
    }, 700 / speed);
    return () => window.clearInterval(timer);
  }, [frames, current.playing, last, speed]);
  return {
    frame: frames[index] as T,
    index,
    count: frames.length,
    playing: current.playing,
    speed,
    setSpeed,
    seek,
    toggle,
    reset: () => seek(0),
  };
}
export type Timeline = ReturnType<typeof useSimulationTimeline>;
export function PlaybackControls({ timeline }: { timeline: Timeline }) {
  return (
    <div className="sim-playback">
      <button
        type="button"
        onClick={timeline.reset}
        disabled={timeline.index === 0 && !timeline.playing}
      >
        Reset
      </button>
      <button
        type="button"
        aria-label="Previous step"
        disabled={timeline.index === 0}
        onClick={() => timeline.seek(timeline.index - 1)}
      >
        ←
      </button>
      <button
        type="button"
        onClick={timeline.toggle}
        disabled={timeline.count < 2}
      >
        {timeline.playing
          ? "Pause"
          : timeline.index === timeline.count - 1
            ? "Replay"
            : "Play"}
      </button>
      <button
        type="button"
        aria-label="Next step"
        disabled={timeline.index >= timeline.count - 1}
        onClick={() => timeline.seek(timeline.index + 1)}
      >
        →
      </button>
      <label className="sim-scrubber">
        Step {timeline.index + 1} / {timeline.count}
        <input
          aria-label="Simulation step"
          type="range"
          min={0}
          max={Math.max(0, timeline.count - 1)}
          value={timeline.index}
          onChange={(e) => timeline.seek(Number(e.target.value))}
        />
      </label>
      <label>
        Speed{" "}
        <select
          aria-label="Playback speed"
          value={timeline.speed}
          onChange={(e) => timeline.setSpeed(Number(e.target.value))}
        >
          {[0.5, 1, 2, 4].map((n) => (
            <option key={n} value={n}>
              {n}×
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
export function ModelNotes({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="sim-model-notes">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        Model & assumptions
      </button>
      {open && (
        <div
          className="sim-notes-popover"
          role="dialog"
          aria-label="Model assumptions"
        >
          <button
            type="button"
            aria-label="Close assumptions"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
          <div>{children}</div>
        </div>
      )}
    </div>
  );
}
