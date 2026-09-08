// @simulation-model-v1
// Hands-On Insertion Sort Tray Simulation
// Montessori-inspired prepared environment demonstrating how rightward element shifting creates the precise slot for sorted insertion.

// Pure Model Logic & State Transitions
function createInitialState(tileList = [7, 3, 5, 2], sortOrder = "Ascending") {
  return {
    initialList: [...tileList],
    sortOrder,
    rack: [...tileList],
    hand: null,
    tray: new Array(tileList.length).fill(null),
    comparisons: 0,
    shifts: 0,
    comparedWithHand: [], // list of tray values compared with currently held hand tile
    lastComparison: null, // { handVal, trayIdx, trayVal, symbol, note }
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

  // Dropping is valid!
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

// Mandatory Simulation Registration
registerSimulation({
  title: "Hands-On Insertion Sort Tray",
  assumptions: [
    "Values are distinct positive integers to maintain unambiguous strict ordering.",
    "The sorted invariant requires every element at tray index i to satisfy the ordering relation with index i+1.",
    "Only one tile may be held in hand at a time, faithfully mirroring iterative insertion sort.",
    "Tiles resting in the tray can only slide rightward into an immediately adjacent vacant slot."
  ],
  checks: [
    {
      name: "Insert smaller element via shifting",
      test: () => {
        let s = createInitialState([7, 3, 5, 2], "Ascending");
        s = pickTile(s); // pick 7
        s = dropTile(s, 0); // drop 7 to slot 0
        s = pickTile(s); // pick 3
        s = slideTile(s, 0); // slide 7 from slot 0 to slot 1
        s = dropTile(s, 0); // drop 3 into open slot 0
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
        s = pickTile(s); // pick 7
        s = dropTile(s, 0); // tray holds [7] in slot 0
        s = pickTile(s); // pick 3
        s = dropTile(s, 1); // drop 3 directly into slot 1 without shifting
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

// React Component
function ConceptSimulation() {
  const sequenceOptions = ["7, 3, 5, 2", "4, 1, 3, 2", "2, 4, 6, 8", "8, 6, 4, 2"];
  const [selectedSeqStr, setSelectedSeqStr] = React.useState("7, 3, 5, 2");
  const [sortOrder, setSortOrder] = React.useState("Ascending");

  const parsedSequence = React.useMemo(() => {
    return selectedSeqStr.split(",").map((s) => parseInt(s.trim(), 10));
  }, [selectedSeqStr]);

  const [state, setState] = React.useState(() => createInitialState(parsedSequence, sortOrder));
  const [history, setHistory] = React.useState([]);

  // Reset when initial sequence or sort order changes
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
  const isComplete = sortedCount === parsedSequence.length && state.hand === null;

  // Visual layout coordinates for 800 x 480 SVG
  const traySlots = parsedSequence.length;
  const slotWidth = 110;
  const slotGap = 24;
  const totalTrayWidth = traySlots * slotWidth + (traySlots - 1) * slotGap;
  const trayStartX = 400 - totalTrayWidth / 2;

  return (
    <SimFrame
      title="Hands-On Insertion Sort Tray"
      description="Physically position tiles into a sorted tray. Shift resting elements rightward to open the exact slot required for each new arrival."
      controls={
        <>
          <Control label="Initial Rack Tiles">
            <select
              value={selectedSeqStr}
              onChange={(e) => setSelectedSeqStr(e.target.value)}
              className="sim-select"
              aria-label="Initial Rack Tiles"
            >
              {sequenceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Control>
          <Control label="Required Sort Order">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="sim-select"
              aria-label="Required Sort Order"
            >
              <option value="Ascending">Ascending (min → max)</option>
              <option value="Descending">Descending (max → min)</option>
            </select>
          </Control>
        </>
      }
      stats={
        <>
          <Stat label="Sorted Prefix" value={`${sortedCount}/${parsedSequence.length}`} unit="tiles" highlight />
          <Stat label="Comparisons" value={state.comparisons} unit="ops" />
          <Stat label="Tile Shifts" value={state.shifts} unit="moves" />
        </>
      }
    >
      <div className="sim-lesson sim-canvas-layout" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div className="sim-lesson-body" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <p
            className="sim-explanation"
            style={{
              margin: "4px 8px",
              fontSize: "13px",
              color: state.invalidSlotIndex !== null ? "#b91c1c" : "#1e293b",
              fontWeight: state.invalidSlotIndex !== null ? "600" : "500",
              minHeight: "20px"
            }}
          >
            {state.lastActionMessage}
          </p>

          <div className="sim-visual-area" style={{ flex: 1, position: "relative", minHeight: 0 }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 800 450"
              preserveAspectRatio="xMidYMid meet"
              style={{ userSelect: "none", fontVariantNumeric: "tabular-nums" }}
            >
              <defs>
                <filter id="tile-shadow" x="-10%" y="-10%" width="125%" height="125%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.16" />
                </filter>
                <filter id="active-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#2563eb" floodOpacity="0.35" />
                </filter>
                <filter id="invalid-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#dc2626" floodOpacity="0.45" />
                </filter>
              </defs>

              {/* Invitation Banner */}
              <g transform="translate(40, 8)">
                <rect x="0" y="0" width="720" height="28" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
                <text x="12" y="18" fill="#475569" fontSize="11px" fontWeight="600">
                  INVITATION:
                </text>
                <text x="94" y="18" fill="#334155" fontSize="11px">
                  Try dropping tile 3 into slot 1 to see the tray reject it, then slide tile 7 right into slot 1 and test slot 0.
                </text>
              </g>

              {/* Action Toolbar: Undo & Reset */}
              <g transform="translate(630, 44)">
                <g
                  role="button"
                  tabIndex="0"
                  aria-label="Undo last action"
                  onClick={handleUndo}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleUndo()}
                  style={{ cursor: history.length > 0 ? "pointer" : "default", opacity: history.length > 0 ? 1 : 0.4 }}
                >
                  <rect x="0" y="0" width="60" height="24" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="30" y="16" textAnchor="middle" fontSize="11px" fontWeight="600" fill="#334155">
                    ↺ Undo
                  </text>
                </g>
                <g
                  role="button"
                  tabIndex="0"
                  aria-label="Reset tray"
                  onClick={handleReset}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleReset()}
                  style={{ cursor: "pointer" }}
                  transform="translate(68, 0)"
                >
                  <rect x="0" y="0" width="60" height="24" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="30" y="16" textAnchor="middle" fontSize="11px" fontWeight="600" fill="#334155">
                    Reset
                  </text>
                </g>
              </g>

              {/* Section 1: Unsorted Rack */}
              <g transform="translate(40, 44)">
                <text x="0" y="16" fontSize="12px" fontWeight="700" fill="#475569" letterSpacing="0.5">
                  UNSORTED RACK
                </text>
                <rect x="0" y="24" width="570" height="66" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />

                {state.rack.length === 0 ? (
                  <text x="285" y="62" textAnchor="middle" fill="#94a3b8" fontSize="13px" fontStyle="italic">
                    All rack tiles taken into the sort process
                  </text>
                ) : (
                  state.rack.map((val, idx) => {
                    const isFirst = idx === 0;
                    const tileX = 20 + idx * 80;
                    return (
                      <g key={`rack-${val}-${idx}`} transform={`translate(${tileX}, 34)`}>
                        <rect
                          x="0"
                          y="0"
                          width="64"
                          height="46"
                          rx="6"
                          fill="#fef3c7"
                          stroke={isFirst && state.hand === null ? "#2563eb" : "#d97706"}
                          strokeWidth={isFirst && state.hand === null ? 2 : 1.5}
                          filter="url(#tile-shadow)"
                        />
                        <text
                          x="32"
                          y="30"
                          textAnchor="middle"
                          fontSize="20px"
                          fontWeight="700"
                          fill="#78350f"
                        >
                          {val}
                        </text>

                        {isFirst && state.hand === null && (
                          <g
                            role="button"
                            tabIndex="0"
                            aria-label={`Pick tile ${val}`}
                            onClick={() => executeAction(pickTile)}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && executeAction(pickTile)}
                            style={{ cursor: "pointer" }}
                            transform="translate(0, -18)"
                          >
                            <rect x="2" y="0" width="60" height="16" rx="3" fill="#2563eb" />
                            <text x="32" y="11" textAnchor="middle" fill="#ffffff" fontSize="9px" fontWeight="700">
                              PICK TILE
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })
                )}
              </g>

              {/* Section 2: Hand Slot & Active Relational Calipers */}
              <g transform="translate(40, 150)">
                <text x="0" y="14" fontSize="12px" fontWeight="700" fill="#475569" letterSpacing="0.5">
                  ACTIVE HAND CRADLE
                </text>

                {/* Hand cradle slot */}
                <rect
                  x="340"
                  y="0"
                  width="120"
                  height="76"
                  rx="8"
                  fill={state.hand !== null ? "#eff6ff" : "#fafafa"}
                  stroke={state.hand !== null ? "#3b82f6" : "#cbd5e1"}
                  strokeDasharray={state.hand === null ? "4,4" : "none"}
                  strokeWidth={2}
                />

                {state.hand !== null ? (
                  <g transform="translate(366, 8)">
                    <rect
                      x="0"
                      y="0"
                      width="68"
                      height="60"
                      rx="6"
                      fill="#fef3c7"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      filter="url(#tile-shadow)"
                    />
                    <text x="34" y="38" textAnchor="middle" fontSize="26px" fontWeight="800" fill="#78350f">
                      {state.hand}
                    </text>
                    <text x="34" y="54" textAnchor="middle" fontSize="9px" fontWeight="600" fill="#2563eb">
                      IN HAND
                    </text>
                  </g>
                ) : (
                  <text x="400" y="44" textAnchor="middle" fill="#94a3b8" fontSize="12px">
                    Empty hand
                  </text>
                )}

                {/* Caliper Badge when comparison active */}
                {state.lastComparison && (
                  <g transform="translate(480, 16)">
                    <rect x="0" y="0" width="260" height="48" rx="6" fill="#f8fafc" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="14" y="20" fontSize="12px" fontWeight="700" fill="#1e293b">
                      Calipers: Hand ({state.lastComparison.handVal}) {state.lastComparison.symbol} Slot {state.lastComparison.trayIdx} ({state.lastComparison.trayVal})
                    </text>
                    <text x="14" y="38" fontSize="10px" fill="#475569">
                      {state.lastComparison.note}
                    </text>
                  </g>
                )}
              </g>

              {/* Section 3: Sorted Tray */}
              <g transform="translate(40, 246)">
                {/* Tray outer boundary */}
                <rect
                  x="0"
                  y="0"
                  width="720"
                  height="174"
                  rx="10"
                  fill="#f1f5f9"
                  stroke="#94a3b8"
                  strokeWidth="2"
                />
                <text x="18" y="22" fontSize="12px" fontWeight="700" fill="#334155" letterSpacing="0.5">
                  SORTED TRAY
                </text>
                <text x="110" y="22" fontSize="11px" fill="#64748b">
                  ({sortOrder} invariant: each slot must satisfy relation with neighbors)
                </text>

                {/* Slots */}
                {state.tray.map((val, idx) => {
                  const x = trayStartX - 40 + idx * (slotWidth + slotGap);
                  const isOccupied = val !== null;
                  const isBlocked = state.invalidSlotIndex === idx;
                  const canSlide = isOccupied && idx + 1 < state.tray.length && state.tray[idx + 1] === null;

                  return (
                    <g key={`tray-slot-${idx}`} transform={`translate(${x}, 32)`}>
                      {/* Slot boundary socket */}
                      <rect
                        x="0"
                        y="0"
                        width={slotWidth}
                        height="124"
                        rx="8"
                        fill={isOccupied ? "#ffffff" : isBlocked ? "#fef2f2" : "#e2e8f0"}
                        stroke={isBlocked ? "#dc2626" : isOccupied ? "#cbd5e1" : "#94a3b8"}
                        strokeWidth={isBlocked ? 2.5 : 1.5}
                        strokeDasharray={!isOccupied ? "3,3" : "none"}
                        filter={isBlocked ? "url(#invalid-glow)" : undefined}
                      />

                      {/* Slot Index Label */}
                      <text x="10" y="18" fontSize="11px" fontWeight="700" fill="#64748b">
                        #{idx}
                      </text>

                      {/* Occupied Tile Content */}
                      {isOccupied ? (
                        <>
                          <rect
                            x="16"
                            y="28"
                            width="78"
                            height="58"
                            rx="6"
                            fill="#fef3c7"
                            stroke={isBlocked ? "#dc2626" : "#d97706"}
                            strokeWidth={isBlocked ? 2 : 1.5}
                            filter="url(#tile-shadow)"
                          />
                          <text x="55" y="65" textAnchor="middle" fontSize="24px" fontWeight="800" fill="#78350f">
                            {val}
                          </text>

                          {/* Compare Button if tile in hand */}
                          {state.hand !== null && (
                            <g
                              role="button"
                              tabIndex="0"
                              aria-label={`Compare hand tile with slot ${idx}`}
                              onClick={() => executeAction((s) => compareTile(s, idx))}
                              onKeyDown={(e) =>
                                (e.key === "Enter" || e.key === " ") && executeAction((s) => compareTile(s, idx))
                              }
                              style={{ cursor: "pointer" }}
                              transform="translate(18, 4)"
                            >
                              <rect x="0" y="0" width="74" height="18" rx="3" fill="#3b82f6" />
                              <text x="37" y="12" textAnchor="middle" fill="#ffffff" fontSize="9px" fontWeight="700">
                                ⚖ COMPARE
                              </text>
                            </g>
                          )}

                          {/* Slide Right Button if adjacent empty */}
                          {canSlide && (
                            <g
                              role="button"
                              tabIndex="0"
                              aria-label={`Slide tile ${val} right into slot ${idx + 1}`}
                              onClick={() => executeAction((s) => slideTile(s, idx))}
                              onKeyDown={(e) =>
                                (e.key === "Enter" || e.key === " ") && executeAction((s) => slideTile(s, idx))
                              }
                              style={{ cursor: "pointer" }}
                              transform="translate(14, 94)"
                            >
                              <rect x="0" y="0" width="82" height="22" rx="4" fill="#2563eb" />
                              <text x="41" y="15" textAnchor="middle" fill="#ffffff" fontSize="10px" fontWeight="700">
                                SLIDE →
                              </text>
                            </g>
                          )}

                          {!canSlide && (
                            <text x="55" y="108" textAnchor="middle" fill="#94a3b8" fontSize="10px">
                              {idx === state.tray.length - 1 ? "End Wall" : "Settled"}
                            </text>
                          )}
                        </>
                      ) : (
                        /* Empty Slot Interaction */
                        <g>
                          <text x="55" y="52" textAnchor="middle" fill="#94a3b8" fontSize="11px" fontStyle="italic">
                            Vacant Slot
                          </text>

                          {state.hand !== null && (
                            <g
                              role="button"
                              tabIndex="0"
                              aria-label={`Drop hand tile into slot ${idx}`}
                              onClick={() => executeAction((s) => dropTile(s, idx))}
                              onKeyDown={(e) =>
                                (e.key === "Enter" || e.key === " ") && executeAction((s) => dropTile(s, idx))
                              }
                              style={{ cursor: "pointer" }}
                              transform="translate(15, 68)"
                            >
                              <rect
                                x="0"
                                y="0"
                                width="80"
                                height="28"
                                rx="5"
                                fill="#16a34a"
                                stroke="#15803d"
                                strokeWidth="1"
                              />
                              <text x="40" y="18" textAnchor="middle" fill="#ffffff" fontSize="11px" fontWeight="700">
                                DROP HERE
                              </text>
                            </g>
                          )}
                        </g>
                      )}

                      {/* Rejection indicator if this was invalid neighbor */}
                      {isBlocked && (
                        <g transform="translate(10, 102)">
                          <rect x="0" y="0" width="90" height="16" rx="3" fill="#dc2626" />
                          <text x="45" y="11" textAnchor="middle" fill="#ffffff" fontSize="9px" fontWeight="700">
                            COLLISION
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Completion Banner */}
              {isComplete && (
                <g transform="translate(240, 426)">
                  <rect x="0" y="0" width="320" height="22" rx="4" fill="#16a34a" />
                  <text x="160" y="15" textAnchor="middle" fill="#ffffff" fontSize="11px" fontWeight="700">
                    ✓ Tray Fully Sorted In {state.shifts} Shifts & {state.comparisons} Comparisons
                  </text>
                </g>
              )}
            </svg>
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
            lifts the active element out of the array (requiring only <em>O(1)</em> temporary space) and slides preceding
            elements directly into adjacent vacant slots.
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