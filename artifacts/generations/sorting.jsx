// @simulation-model-v1
// Hands-On Insertion Sort Tray Simulation

function createInitialState(tileList = [7, 3, 5, 2], sortOrder = "Ascending") {
  return {
    initialList: [...tileList],
    sortOrder,
    rack: [...tileList],
    hand: null,
    tray: new Array(tileList.length).fill(null),
    comparisons: 0,
    shifts: 0,
    comparedWithHand: [],
    lastComparison: null,
    slotStatus: "Ready",
    invalidSlotIndex: null,
    lastActionMessage: `Pick tile ${tileList[0]} from the unsorted rack to begin.`
  };
}

function pickTile(state) {
  if (state.hand !== null || state.rack.length === 0) return state;
  const val = state.rack[0];
  const newRack = state.rack.slice(1);
  return {
    ...state,
    rack: newRack,
    hand: val,
    comparedWithHand: [],
    lastComparison: null,
    invalidSlotIndex: null,
    slotStatus: "Hand Holding Tile",
    lastActionMessage: `Holding tile ${val}. Find its ordered position or compare it against settled tray tiles.`
  };
}

function slideTile(state, fromIdx) {
  if (fromIdx < 0 || fromIdx >= state.tray.length - 1) return state;
  const val = state.tray[fromIdx];
  if (val === null || state.tray[fromIdx + 1] !== null) return state;

  const newTray = [...state.tray];
  newTray[fromIdx] = null;
  newTray[fromIdx + 1] = val;

  return {
    ...state,
    tray: newTray,
    shifts: state.shifts + 1,
    invalidSlotIndex: null,
    slotStatus: "Shifted Tile",
    lastActionMessage: `Shifted tile ${val} rightward into slot ${fromIdx + 1}, opening vacant slot ${fromIdx}.`
  };
}

function compareTile(state, slotIdx) {
  if (state.hand === null || slotIdx < 0 || slotIdx >= state.tray.length) return state;
  const trayVal = state.tray[slotIdx];
  if (trayVal === null) return state;

  const H = state.hand;
  const already = state.comparedWithHand.includes(trayVal);
  const newCompared = already ? state.comparedWithHand : [...state.comparedWithHand, trayVal];
  const newComps = already ? state.comparisons : state.comparisons + 1;

  let symbol = "=";
  if (H < trayVal) symbol = "<";
  else if (H > trayVal) symbol = ">";

  const isAsc = state.sortOrder === "Ascending";
  const note = isAsc
    ? H < trayVal
      ? `Tile ${H} must settle to the LEFT of ${trayVal}`
      : H > trayVal
      ? `Tile ${H} must settle to the RIGHT of ${trayVal}`
      : `Tile ${H} is equal to ${trayVal}`
    : H > trayVal
    ? `Tile ${H} must settle to the LEFT of ${trayVal}`
    : H < trayVal
    ? `Tile ${H} must settle to the RIGHT of ${trayVal}`
    : `Tile ${H} is equal to ${trayVal}`;

  return {
    ...state,
    comparisons: newComps,
    comparedWithHand: newCompared,
    lastComparison: { handVal: H, trayIdx: slotIdx, trayVal, symbol, note },
    lastActionMessage: `Compared hand tile ${H} with slot ${slotIdx} (${trayVal}): ${H} ${symbol} ${trayVal}. ${note}.`
  };
}

function dropTile(state, slotIdx) {
  if (state.hand === null || slotIdx < 0 || slotIdx >= state.tray.length) return state;
  if (state.tray[slotIdx] !== null) {
    return {
      ...state,
      slotStatus: "Blocked: Slot Occupied",
      invalidSlotIndex: slotIdx,
      lastActionMessage: `Slot ${slotIdx} is already occupied by tile ${state.tray[slotIdx]}.`
    };
  }

  const H = state.hand;
  let compCount = state.comparisons;
  const newCompared = [...state.comparedWithHand];
  const isAsc = state.sortOrder === "Ascending";

  // Check left neighbor (slotIdx - 1)
  if (slotIdx > 0 && state.tray[slotIdx - 1] !== null) {
    const L = state.tray[slotIdx - 1];
    if (!newCompared.includes(L)) {
      newCompared.push(L);
      compCount += 1;
    }
    if (isAsc && L > H) {
      return {
        ...state,
        comparisons: compCount,
        comparedWithHand: newCompared,
        slotStatus: "Blocked: Left Greater",
        invalidSlotIndex: slotIdx - 1,
        lastActionMessage: `Blocked: Left neighbor (${L}) > (${H}). Ascending order requires smaller tiles on the left.`
      };
    }
    if (!isAsc && L < H) {
      return {
        ...state,
        comparisons: compCount,
        comparedWithHand: newCompared,
        slotStatus: "Blocked: Left Smaller",
        invalidSlotIndex: slotIdx - 1,
        lastActionMessage: `Blocked: Left neighbor (${L}) < (${H}). Descending order requires larger tiles on the left.`
      };
    }
  }

  // Check right neighbor (slotIdx + 1)
  if (slotIdx + 1 < state.tray.length && state.tray[slotIdx + 1] !== null) {
    const R = state.tray[slotIdx + 1];
    if (!newCompared.includes(R)) {
      newCompared.push(R);
      compCount += 1;
    }
    if (isAsc && H > R) {
      return {
        ...state,
        comparisons: compCount,
        comparedWithHand: newCompared,
        slotStatus: "Blocked: Right Smaller",
        invalidSlotIndex: slotIdx + 1,
        lastActionMessage: `Blocked: Hand tile (${H}) > right neighbor (${R}). Ascending order requires smaller tiles on the left.`
      };
    }
    if (!isAsc && H < R) {
      return {
        ...state,
        comparisons: compCount,
        comparedWithHand: newCompared,
        slotStatus: "Blocked: Right Greater",
        invalidSlotIndex: slotIdx + 1,
        lastActionMessage: `Blocked: Hand tile (${H}) < right neighbor (${R}). Descending order requires larger tiles on the left.`
      };
    }
  }

  // Valid placement
  const newTray = [...state.tray];
  newTray[slotIdx] = H;
  const settledCount = newTray.filter((t) => t !== null).length;
  const isFinished = settledCount === state.initialList.length;

  return {
    ...state,
    tray: newTray,
    hand: null,
    comparisons: compCount,
    comparedWithHand: [],
    lastComparison: null,
    invalidSlotIndex: null,
    slotStatus: "Valid Placement",
    lastActionMessage: isFinished
      ? `All ${settledCount} tiles settled in sorted order! Total shifts: ${state.shifts}, comparisons: ${compCount}.`
      : `Placed tile ${H} into slot ${slotIdx}. Sorted prefix now contains ${settledCount} tiles.`
  };
}

registerSimulation({
  title: "Hands-On Insertion Sort Tray",
  assumptions: [
    "Values are distinct positive integers to maintain strict ordering.",
    "The sorted invariant requires elements to satisfy the order relation with immediate neighbors.",
    "Only one tile may be held in hand at a time, mirroring insertion sort.",
    "Settled tiles slide rightward into an adjacent vacant slot to open a space."
  ],
  checks: [
    {
      name: "Insert smaller element via shifting",
      test: () => {
        let s = createInitialState([7, 3, 5, 2], "Ascending");
        s = pickTile(s);
        s = dropTile(s, 0);
        s = pickTile(s);
        s = slideTile(s, 0);
        s = dropTile(s, 0);
        return (
          s.tray[0] === 3 &&
          s.tray[1] === 7 &&
          s.hand === null &&
          s.comparisons === 1 &&
          s.shifts === 1 &&
          s.slotStatus === "Valid Placement"
        );
      }
    },
    {
      name: "Blocked placement violating invariant",
      test: () => {
        let s = createInitialState([7, 3, 5, 2], "Ascending");
        s = pickTile(s);
        s = dropTile(s, 0);
        s = pickTile(s);
        s = dropTile(s, 1);
        return (
          s.tray[0] === 7 &&
          s.tray[1] === null &&
          s.hand === 3 &&
          s.comparisons === 1 &&
          s.shifts === 0 &&
          s.slotStatus === "Blocked: Left Greater"
        );
      }
    },
    {
      name: "Edge case: Element already larger than all sorted elements",
      test: () => {
        let s = {
          initialList: [3, 5, 7, 2],
          sortOrder: "Ascending",
          rack: [2],
          hand: 7,
          tray: [3, 5, null, null],
          comparisons: 0,
          shifts: 0,
          comparedWithHand: [],
          lastComparison: null,
          slotStatus: "Ready",
          invalidSlotIndex: null,
          lastActionMessage: "Picked 7"
        };
        s = compareTile(s, 1);
        s = dropTile(s, 2);
        return (
          s.tray[0] === 3 &&
          s.tray[1] === 5 &&
          s.tray[2] === 7 &&
          s.hand === null &&
          s.comparisons === 1 &&
          s.shifts === 0 &&
          s.slotStatus === "Valid Placement"
        );
      }
    }
  ]
});

function ConceptSimulation() {
  const sequenceOptions = ["7, 3, 5, 2", "4, 1, 3, 2", "2, 4, 6, 8", "8, 6, 4, 2"];
  const [selectedSeqStr, setSelectedSeqStr] = React.useState("7, 3, 5, 2");
  const [sortOrder, setSortOrder] = React.useState("Ascending");

  const parsedSequence = React.useMemo(() => {
    return selectedSeqStr.split(",").map((s) => parseInt(s.trim(), 10));
  }, [selectedSeqStr]);

  const [state, setState] = React.useState(() => createInitialState(parsedSequence, sortOrder));
  const [history, setHistory] = React.useState([]);

  React.useEffect(() => {
    setState(createInitialState(parsedSequence, sortOrder));
    setHistory([]);
  }, [selectedSeqStr, sortOrder, parsedSequence]);

  const executeAction = (actionFn) => {
    setHistory((prev) => [...prev, state]);
    setState((curr) => actionFn(curr));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setState(prev);
  };

  const handleReset = () => {
    setHistory([]);
    setState(createInitialState(parsedSequence, sortOrder));
  };

  useSimulationSnapshot({
    title: "Hands-On Insertion Sort Tray",
    assumptions: [
      "Values are distinct positive integers",
      "Sorted prefix requires monotonic order",
      "One tile in hand at a time",
      "Tray tiles slide rightward into adjacent empty slots"
    ],
    parameters: {
      initialSequence: selectedSeqStr,
      sortOrder
    },
    state: {
      tray: state.tray,
      hand: state.hand,
      rack: state.rack,
      comparisons: state.comparisons,
      shifts: state.shifts,
      slotStatus: state.slotStatus,
      lastActionMessage: state.lastActionMessage
    }
  });

  const sortedCount = state.tray.filter((t) => t !== null).length;

  return (
    <SimFrame
      title="Insertion Sort Tray"
      description="Slide settled tiles to the right to open space for each arriving element."
      controls={
        <>
          <Control label="Rack Tiles">
            <select
              value={selectedSeqStr}
              onChange={(e) => setSelectedSeqStr(e.target.value)}
              className="sim-select"
            >
              {sequenceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Control>
          <Control label="Sort Order">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="sim-select"
            >
              <option value="Ascending">Ascending</option>
              <option value="Descending">Descending</option>
            </select>
          </Control>
        </>
      }
      stats={
        <>
          <Stat label="Sorted" value={`${sortedCount}/${parsedSequence.length}`} unit="tiles" highlight />
          <Stat label="Comparisons" value={state.comparisons} unit="ops" />
          <Stat label="Shifts" value={state.shifts} unit="moves" />
        </>
      }
    >
      <div className="sim-lesson sim-canvas-layout" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div className="sim-lesson-body" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: "8px 12px", boxSizing: "border-box" }}>

          {/* Brief invitation & feedback */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", gap: "8px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                lineHeight: "1.3",
                color: state.invalidSlotIndex !== null ? "#b91c1c" : "#334155",
                fontWeight: state.invalidSlotIndex !== null ? "600" : "500"
              }}
            >
              {state.lastActionMessage}
            </p>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                style={{
                  height: "32px",
                  padding: "0 10px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: history.length > 0 ? "pointer" : "default",
                  opacity: history.length > 0 ? 1 : 0.4,
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px"
                }}
              >
                ↺ Undo
              </button>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  height: "32px",
                  padding: "0 10px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px"
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <div
            className="sim-visual-area"
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "8px"
            }}
          >
            {/* Top Row: Unsorted Rack & Hand Tile */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "12px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                padding: "8px 12px",
                alignItems: "center"
              }}
            >
              {/* Rack Area */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>
                  Rack:
                </span>
                {state.rack.length === 0 ? (
                  <span style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>Rack empty</span>
                ) : (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {state.rack.map((val, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <div
                          key={`rack-${val}-${idx}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#fef3c7",
                            border: isFirst && state.hand === null ? "2px solid #2563eb" : "1px solid #d97706",
                            borderRadius: "6px",
                            padding: "4px 8px"
                          }}
                        >
                          <span style={{ fontSize: "18px", fontWeight: "700", color: "#78350f" }}>{val}</span>
                          {isFirst && state.hand === null && (
                            <button
                              type="button"
                              onClick={() => executeAction(pickTile)}
                              style={{
                                height: "32px",
                                padding: "0 10px",
                                background: "#2563eb",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer"
                              }}
                            >
                              Pick
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hand Area */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: state.hand !== null ? "#eff6ff" : "#f1f5f9",
                  border: state.hand !== null ? "2px solid #3b82f6" : "1px dashed #cbd5e1"
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Hand:</span>
                {state.hand !== null ? (
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      background: "#fef3c7",
                      border: "2px solid #2563eb",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      fontWeight: "800",
                      color: "#78350f"
                    }}
                  >
                    {state.hand}
                  </div>
                ) : (
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Empty</span>
                )}
              </div>
            </div>

            {/* Bottom Row: Sorted Tray Slots */}
            <div
              style={{
                flex: 1,
                minHeight: "130px",
                display: "grid",
                gridTemplateColumns: `repeat(${parsedSequence.length}, 1fr)`,
                gap: "10px",
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "10px",
                alignItems: "stretch"
              }}
            >
              {state.tray.map((val, idx) => {
                const isOccupied = val !== null;
                const isBlocked = state.invalidSlotIndex === idx;
                const canSlide = isOccupied && idx + 1 < state.tray.length && state.tray[idx + 1] === null;

                return (
                  <div
                    key={`slot-${idx}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: isOccupied ? "#ffffff" : isBlocked ? "#fef2f2" : "#f8fafc",
                      border: isBlocked ? "2px solid #dc2626" : isOccupied ? "1px solid #cbd5e1" : "1px dashed #94a3b8",
                      borderRadius: "6px",
                      padding: "8px",
                      boxSizing: "border-box",
                      position: "relative"
                    }}
                  >
                    {/* Slot Header / Number */}
                    <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Slot {idx}</span>
                      {isBlocked && (
                        <span style={{ fontSize: "10px", fontWeight: "700", color: "#dc2626" }}>Conflict</span>
                      )}
                    </div>

                    {/* Slot Middle: Tile or Vacant */}
                    {isOccupied ? (
                      <div
                        style={{
                          width: "52px",
                          height: "46px",
                          background: "#fef3c7",
                          border: isBlocked ? "2px solid #dc2626" : "1.5px solid #d97706",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                          fontWeight: "800",
                          color: "#78350f"
                        }}
                      >
                        {val}
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>Vacant</div>
                    )}

                    {/* Slot Actions */}
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "4px", minHeight: "36px", justifyContent: "flex-end" }}>
                      {isOccupied ? (
                        <>
                          {canSlide && (
                            <button
                              type="button"
                              onClick={() => executeAction((s) => slideTile(s, idx))}
                              style={{
                                width: "100%",
                                height: "34px",
                                background: "#2563eb",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer"
                              }}
                            >
                              Slide →
                            </button>
                          )}
                          {state.hand !== null && (
                            <button
                              type="button"
                              onClick={() => executeAction((s) => compareTile(s, idx))}
                              style={{
                                width: "100%",
                                height: "32px",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                border: "1px solid #bfdbfe",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "600",
                                cursor: "pointer"
                              }}
                            >
                              Compare
                            </button>
                          )}
                        </>
                      ) : (
                        state.hand !== null && (
                          <button
                            type="button"
                            onClick={() => executeAction((s) => dropTile(s, idx))}
                            style={{
                              width: "100%",
                              height: "36px",
                              background: "#16a34a",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            Drop Here
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <ModelNotes>
          <p>
            <strong>Core Scientific Invariant:</strong> Insertion Sort incrementally grows a strictly ordered collection.
            At iteration <em>k</em>, items in slots 0 through <em>k-1</em> are sorted. To insert the <em>k</em>-th item,
            all settled elements exceeding it (in ascending order) must shift rightward by one slot to open the vacant gap.
          </p>
          <p>
            <strong>Shift vs Swap:</strong> Unlike Bubble Sort which repeatedly exchanges adjacent pairs, Insertion Sort
            lifts the active element out of the array and slides preceding elements directly into adjacent vacant slots.
          </p>
          <p>
            <strong>Time Complexity:</strong> Reverse-sorted arrays require <em>O(N²)</em> shifts and comparisons (worst-case),
            whereas already-sorted arrays take only <em>O(N)</em> comparisons and 0 shifts (best-case).
          </p>
        </ModelNotes>
      </div>
    </SimFrame>
  );
}

render(<ConceptSimulation />);
