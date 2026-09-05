import React from "react";

export const SimulationObservationContext = React.createContext<
  ((snapshot: string) => void) | undefined
>(undefined);
/** Publish only model parameters/state, never UI or account data. The assistant receives this on an explicit question. */
export function useSimulationSnapshot(snapshot: unknown) {
  const publish = React.useContext(SimulationObservationContext);
  const serialized = JSON.stringify(snapshot);
  React.useEffect(() => {
    if (serialized && serialized.length <= 16000) publish?.(serialized);
    else
      publish?.(
        JSON.stringify({
          note: "Live state unavailable: snapshot exceeds the size limit.",
        }),
      );
  }, [publish, serialized]);
}
