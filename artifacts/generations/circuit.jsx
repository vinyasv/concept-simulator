// @simulation-model-v1
function computeCircuit({ topology, switch_1, switch_2, v_source, r_bulb }) {
  const s1Closed = switch_1 === 'Closed';
  const s2Closed = switch_2 === 'Closed';

  if (topology === 'Series') {
    if (s1Closed && s2Closed) {
      const R_eq = 2 * r_bulb;
      const I_total = R_eq > 0 ? v_source / R_eq : 0;
      const I_bulb1 = I_total;
      const I_bulb2 = I_total;
      const V_bulb1 = I_bulb1 * r_bulb;
      const V_bulb2 = I_bulb2 * r_bulb;
      const P_bulb1 = V_bulb1 * I_bulb1;
      const P_bulb2 = V_bulb2 * I_bulb2;
      return {
        R_eq,
        I_total,
        V_bulb1,
        I_bulb1,
        P_bulb1,
        V_bulb2,
        I_bulb2,
        P_bulb2,
      };
    } else {
      return {
        R_eq: Infinity,
        I_total: 0,
        V_bulb1: 0,
        I_bulb1: 0,
        P_bulb1: 0,
        V_bulb2: 0,
        I_bulb2: 0,
        P_bulb2: 0,
      };
    }
  } else {
    // Parallel topology
    let R_eq;
    if (s1Closed && s2Closed) {
      R_eq = r_bulb / 2;
    } else if (s1Closed || s2Closed) {
      R_eq = r_bulb;
    } else {
      R_eq = Infinity;
    }

    const V_bulb1 = s1Closed ? v_source : 0;
    const I_bulb1 = s1Closed && r_bulb > 0 ? v_source / r_bulb : 0;
    const P_bulb1 = s1Closed && r_bulb > 0 ? (v_source * v_source) / r_bulb : 0;

    const V_bulb2 = s2Closed ? v_source : 0;
    const I_bulb2 = s2Closed && r_bulb > 0 ? v_source / r_bulb : 0;
    const P_bulb2 = s2Closed && r_bulb > 0 ? (v_source * v_source) / r_bulb : 0;

    const I_total = I_bulb1 + I_bulb2;

    return {
      R_eq,
      I_total,
      V_bulb1,
      I_bulb1,
      P_bulb1,
      V_bulb2,
      I_bulb2,
      P_bulb2,
    };
  }
}

function getCircuitExplanation({ topology, switch1, switch2, circuit, vSource, lastAction }) {
  if (lastAction === 'init') {
    return "Can you keep one bulb lit while turning the other off, or change wiring to make both shine brighter?";
  }
  if (lastAction === 'reset') {
    return `Reset to initial Series loop: both switches closed, sharing ${vSource} V at ${circuit.P_bulb1.toFixed(1)} W each.`;
  }

  const s1 = switch1 === 'Closed';
  const s2 = switch2 === 'Closed';

  if (vSource === 0) {
    return "Battery EMF is 0 V: with no potential difference, all branches remain unpowered (0.0 W).";
  }

  if (topology === 'Series') {
    if (!s1 && !s2) {
      return "Both switches are open: the series loop is broken in two places and no current can flow (0.00 A).";
    }
    if (!s1) {
      return "Opening Switch 1 broke the series loop: current halted everywhere (0.00 A) and both bulbs went dark.";
    }
    if (!s2) {
      return "Opening Switch 2 broke the series return path: both bulbs immediately extinguished (0.00 A).";
    }
    return `Series loop complete: ${circuit.I_total.toFixed(2)} A flows through both bulbs, sharing the ${vSource} V battery (${circuit.V_bulb1.toFixed(1)} V, ${circuit.P_bulb1.toFixed(1)} W each).`;
  } else {
    // Parallel topology
    if (!s1 && !s2) {
      return "In Parallel with both switches open, both branches are isolated and draw zero power (0.0 W).";
    }
    if (!s1 && s2) {
      return `Parallel branches are independent: Switch 1 is open (Bulb 1 at 0.0 W), but Bulb 2 receives the full ${vSource} V (${circuit.P_bulb2.toFixed(1)} W).`;
    }
    if (s1 && !s2) {
      return `Parallel branches are independent: Switch 2 is open (Bulb 2 at 0.0 W), but Bulb 1 receives the full ${vSource} V (${circuit.P_bulb1.toFixed(1)} W).`;
    }
    return `In Parallel, each branch receives the full ${vSource} V independently, dissipating ${circuit.P_bulb1.toFixed(1)} W per bulb (${(circuit.P_bulb1 + circuit.P_bulb2).toFixed(1)} W total).`;
  }
}

registerSimulation({
  title: "Series and Parallel Circuits Exploration",
  assumptions: [
    "Bulb filaments behave as ideal ohmic resistors with constant resistance independent of operating temperature.",
    "The DC battery is an ideal voltage source with zero internal resistance.",
    "Connecting copper wires and closed switches possess zero electrical resistance.",
    "Open switches provide infinite resistance with zero leakage current.",
    "Perceived visual brightness scales monotonically with electrical power dissipated in each filament."
  ],
  checks: [
    {
      name: "Series baseline with both switches closed",
      test: () => {
        const res = computeCircuit({ topology: 'Series', switch_1: 'Closed', switch_2: 'Closed', v_source: 12, r_bulb: 6 });
        return Math.abs(res.R_eq - 12.0) < 1e-4 &&
               Math.abs(res.I_total - 1.0) < 1e-4 &&
               Math.abs(res.V_bulb1 - 6.0) < 1e-4 &&
               Math.abs(res.V_bulb2 - 6.0) < 1e-4 &&
               Math.abs(res.P_bulb1 - 6.0) < 1e-4 &&
               Math.abs(res.P_bulb2 - 6.0) < 1e-4;
      }
    },
    {
      name: "Series circuit broken by opening switch 1",
      test: () => {
        const res = computeCircuit({ topology: 'Series', switch_1: 'Open', switch_2: 'Closed', v_source: 12, r_bulb: 6 });
        return res.R_eq === Infinity &&
               res.I_total === 0 &&
               res.V_bulb1 === 0 &&
               res.V_bulb2 === 0 &&
               res.P_bulb1 === 0 &&
               res.P_bulb2 === 0;
      }
    },
    {
      name: "Parallel circuit full load with both switches closed",
      test: () => {
        const res = computeCircuit({ topology: 'Parallel', switch_1: 'Closed', switch_2: 'Closed', v_source: 12, r_bulb: 6 });
        return Math.abs(res.R_eq - 3.0) < 1e-4 &&
               Math.abs(res.I_total - 4.0) < 1e-4 &&
               Math.abs(res.V_bulb1 - 12.0) < 1e-4 &&
               Math.abs(res.V_bulb2 - 12.0) < 1e-4 &&
               Math.abs(res.I_bulb1 - 2.0) < 1e-4 &&
               Math.abs(res.I_bulb2 - 2.0) < 1e-4 &&
               Math.abs(res.P_bulb1 - 24.0) < 1e-4 &&
               Math.abs(res.P_bulb2 - 24.0) < 1e-4;
      }
    },
    {
      name: "Parallel branch independence when switch 1 opens",
      test: () => {
        const res = computeCircuit({ topology: 'Parallel', switch_1: 'Open', switch_2: 'Closed', v_source: 12, r_bulb: 6 });
        return Math.abs(res.R_eq - 6.0) < 1e-4 &&
               Math.abs(res.I_total - 2.0) < 1e-4 &&
               res.I_bulb1 === 0 &&
               res.V_bulb1 === 0 &&
               res.P_bulb1 === 0 &&
               Math.abs(res.I_bulb2 - 2.0) < 1e-4 &&
               Math.abs(res.V_bulb2 - 12.0) < 1e-4 &&
               Math.abs(res.P_bulb2 - 24.0) < 1e-4;
      }
    },
    {
      name: "Zero voltage boundary invariant",
      test: () => {
        const res = computeCircuit({ topology: 'Parallel', switch_1: 'Closed', switch_2: 'Closed', v_source: 0, r_bulb: 6 });
        return Math.abs(res.R_eq - 3.0) < 1e-4 &&
               res.I_total === 0 &&
               res.I_bulb1 === 0 &&
               res.I_bulb2 === 0 &&
               res.V_bulb1 === 0 &&
               res.V_bulb2 === 0 &&
               res.P_bulb1 === 0 &&
               res.P_bulb2 === 0;
      }
    },
    {
      name: "Mixed sequence: open switch 1 in series, then evaluate parallel",
      test: () => {
        const seriesOpen = computeCircuit({ topology: 'Series', switch_1: 'Open', switch_2: 'Closed', v_source: 12, r_bulb: 6 });
        const parallelOpen = computeCircuit({ topology: 'Parallel', switch_1: 'Open', switch_2: 'Closed', v_source: 12, r_bulb: 6 });
        return seriesOpen.P_bulb1 === 0 &&
               seriesOpen.P_bulb2 === 0 &&
               seriesOpen.I_total === 0 &&
               parallelOpen.P_bulb1 === 0 &&
               Math.abs(parallelOpen.P_bulb2 - 24.0) < 1e-4 &&
               Math.abs(parallelOpen.I_total - 2.0) < 1e-4 &&
               Math.abs(parallelOpen.V_bulb2 - 12.0) < 1e-4;
      }
    }
  ]
});

function ConceptSimulation() {
  const [topology, setTopology] = React.useState('Series');
  const [switch1, setSwitch1] = React.useState('Closed');
  const [switch2, setSwitch2] = React.useState('Closed');
  const [vSource, setVSource] = React.useState(12);
  const [rBulb, setRBulb] = React.useState(6);
  const [lastAction, setLastAction] = React.useState('init');

  const circuit = React.useMemo(() => {
    return computeCircuit({
      topology,
      switch_1: switch1,
      switch_2: switch2,
      v_source: vSource,
      r_bulb: rBulb
    });
  }, [topology, switch1, switch2, vSource, rBulb]);

  useSimulationSnapshot({
    title: "Series and Parallel Circuits Exploration",
    assumptions: [
      "Bulb filaments behave as ideal ohmic resistors with constant resistance independent of operating temperature.",
      "The DC battery is an ideal voltage source with zero internal resistance.",
      "Connecting copper wires and closed switches possess zero electrical resistance.",
      "Open switches provide infinite resistance with zero leakage current."
    ],
    parameters: {
      topology,
      switch_1: switch1,
      switch_2: switch2,
      v_source: vSource,
      r_bulb: rBulb
    },
    state: {
      R_eq: circuit.R_eq,
      I_total: circuit.I_total,
      V_bulb1: circuit.V_bulb1,
      I_bulb1: circuit.I_bulb1,
      P_bulb1: circuit.P_bulb1,
      V_bulb2: circuit.V_bulb2,
      I_bulb2: circuit.I_bulb2,
      P_bulb2: circuit.P_bulb2,
      lastAction
    }
  });

  const handleReset = () => {
    setTopology('Series');
    setSwitch1('Closed');
    setSwitch2('Closed');
    setVSource(12);
    setRBulb(6);
    setLastAction('reset');
  };

  const toggleSwitch1 = () => {
    const next = switch1 === 'Closed' ? 'Open' : 'Closed';
    setSwitch1(next);
    setLastAction(`sw1_${next.toLowerCase()}`);
  };

  const toggleSwitch2 = () => {
    const next = switch2 === 'Closed' ? 'Open' : 'Closed';
    setSwitch2(next);
    setLastAction(`sw2_${next.toLowerCase()}`);
  };

  const selectTopology = (mode) => {
    setTopology(mode);
    setLastAction(`topology_${mode.toLowerCase()}`);
  };

  const explanation = getCircuitExplanation({
    topology,
    switch1,
    switch2,
    circuit,
    vSource,
    lastAction
  });

  // Flow animation speeds
  const flowSpeed = circuit.I_total > 0 ? Math.max(0.4, 2.0 / circuit.I_total).toFixed(2) : 0;

  return (
    <SimFrame
      title="Series and Parallel Circuits"
      description="Compare how current distribution, voltage drops, and branch independence change between series loops and parallel ladders."
      controls={
        <>
          <Control label="Battery EMF" value={`${vSource} V`}>
            <input
              type="range"
              min={0}
              max={24}
              step={1}
              value={vSource}
              onChange={(e) => {
                setVSource(Number(e.target.value));
                setLastAction('voltage_changed');
              }}
              aria-label="DC Battery electromotive force in volts"
            />
          </Control>
          <Control label="Bulb Resistance" value={`${rBulb} Ω`}>
            <input
              type="range"
              min={2}
              max={16}
              step={1}
              value={rBulb}
              onChange={(e) => {
                setRBulb(Number(e.target.value));
                setLastAction('resistance_changed');
              }}
              aria-label="Bulb filament resistance in ohms"
            />
          </Control>
        </>
      }
      stats={
        <>
          <Stat
            label="Equivalent Resistance"
            value={circuit.R_eq === Infinity ? '∞' : circuit.R_eq.toFixed(1)}
            unit="Ω"
            highlight={circuit.R_eq !== Infinity}
          />
          <Stat
            label="Total Current"
            value={circuit.I_total.toFixed(2)}
            unit="A"
            highlight={circuit.I_total > 0}
          />
          <Stat
            label="Total Power"
            value={(circuit.P_bulb1 + circuit.P_bulb2).toFixed(1)}
            unit="W"
            highlight={circuit.P_bulb1 + circuit.P_bulb2 > 0}
          />
        </>
      }
    >
      <div
        className="sim-lesson sim-canvas-layout"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          minWidth: 0,
          width: '100%'
        }}
      >
        <div
          className="sim-lesson-body"
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            minWidth: 0
          }}
        >
          {/* Canvas Primary Control & Explanation Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              gap: '10px',
              flexWrap: 'wrap'
            }}
          >
            {/* Direct Wiring Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
                WIRING:
              </span>
              <button
                type="button"
                onClick={() => selectTopology('Series')}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: topology === 'Series' ? '#0f172a' : '#cbd5e1',
                  background: topology === 'Series' ? '#0f172a' : '#ffffff',
                  color: topology === 'Series' ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  minHeight: '32px'
                }}
                aria-pressed={topology === 'Series'}
              >
                Series
              </button>
              <button
                type="button"
                onClick={() => selectTopology('Parallel')}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: topology === 'Parallel' ? '#0f172a' : '#cbd5e1',
                  background: topology === 'Parallel' ? '#0f172a' : '#ffffff',
                  color: topology === 'Parallel' ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  minHeight: '32px'
                }}
                aria-pressed={topology === 'Parallel'}
              >
                Parallel
              </button>
            </div>

            {/* Concise Dynamic Feedback */}
            <p
              className="sim-explanation"
              style={{
                margin: 0,
                fontSize: '12.5px',
                color: '#1e293b',
                fontWeight: 500,
                flex: 1,
                minWidth: '220px',
                lineHeight: 1.3
              }}
            >
              {explanation}
            </p>

            {/* Direct Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                background: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                minHeight: '32px',
                flexShrink: 0
              }}
              title="Reset circuit to initial Series state"
            >
              ↺ Reset
            </button>
          </div>

          {/* Interactive Responsive SVG Canvas */}
          <div
            className="sim-visual-area"
            style={{
              flex: 1,
              minHeight: 0,
              position: 'relative',
              background: '#ffffff',
              width: '100%',
              height: '100%'
            }}
          >
            <svg
              viewBox="0 0 540 220"
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
              style={{ display: 'block' }}
            >
              <defs>
                <style>{`
                  @keyframes dash-flow-fwd {
                    from { stroke-dashoffset: 24; }
                    to { stroke-dashoffset: 0; }
                  }
                  @keyframes dash-flow-rev {
                    from { stroke-dashoffset: 0; }
                    to { stroke-dashoffset: 24; }
                  }
                  .flow-fwd {
                    animation: dash-flow-fwd ${flowSpeed}s linear infinite;
                  }
                  .flow-rev {
                    animation: dash-flow-rev ${flowSpeed}s linear infinite;
                  }
                  .clickable-knob:hover {
                    opacity: 0.85;
                  }
                  .switch-group:focus {
                    outline: none;
                  }
                  .switch-group:focus rect.switch-base {
                    stroke: #2563eb;
                    stroke-width: 2;
                  }
                `}</style>

                {/* Radial Glow Filters for Bulbs */}
                <radialGradient id="glow-b1" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity={circuit.P_bulb1 > 0 ? 0.75 : 0} />
                  <stop offset="60%" stopColor="#f59e0b" stopOpacity={circuit.P_bulb1 > 0 ? 0.35 : 0} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="glow-b2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity={circuit.P_bulb2 > 0 ? 0.75 : 0} />
                  <stop offset="60%" stopColor="#f59e0b" stopOpacity={circuit.P_bulb2 > 0 ? 0.35 : 0} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Grid backdrop */}
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f8fafc" strokeWidth="1" />
              </pattern>
              <rect width="540" height="220" fill="url(#grid)" />

              {/* ====================================================
                  WIRING HARNESS (Changes cleanly by topology)
                  ==================================================== */}
              {topology === 'Series' ? (
                // SERIES LOOP WIRES
                <g id="series-wires">
                  {/* Battery (+) to Switch 1 */}
                  <line x1="72" y1="58" x2="140" y2="58" stroke="#cbd5e1" strokeWidth="3.5" />
                  {circuit.I_total > 0 && (
                    <line x1="72" y1="58" x2="140" y2="58" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 8" className="flow-fwd" />
                  )}

                  {/* Switch 1 to Bulb 1 */}
                  <line x1="190" y1="58" x2="310" y2="58" stroke="#cbd5e1" strokeWidth="3.5" />
                  {circuit.I_total > 0 && (
                    <line x1="190" y1="58" x2="310" y2="58" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 8" className="flow-fwd" />
                  )}

                  {/* Bulb 1 right -> drops to lower rail -> Bulb 2 right */}
                  <path d="M 358 58 L 490 58 L 490 162 L 358 162" fill="none" stroke="#cbd5e1" strokeWidth="3.5" />
                  {circuit.I_total > 0 && (
                    <path d="M 358 58 L 490 58 L 490 162 L 358 162" fill="none" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 8" className="flow-fwd" />
                  )}

                  {/* Bulb 2 left to Switch 2 */}
                  <line x1="310" y1="162" x2="190" y2="162" stroke="#cbd5e1" strokeWidth="3.5" />
                  {circuit.I_total > 0 && (
                    <line x1="310" y1="162" x2="190" y2="162" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 8" className="flow-rev" />
                  )}

                  {/* Switch 2 to Battery (-) */}
                  <line x1="140" y1="162" x2="72" y2="162" stroke="#cbd5e1" strokeWidth="3.5" />
                  {circuit.I_total > 0 && (
                    <line x1="140" y1="162" x2="72" y2="162" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 8" className="flow-rev" />
                  )}
                </g>
              ) : (
                // PARALLEL LADDER WIRES
                <g id="parallel-wires">
                  {/* Battery (+) to distributor junction */}
                  <line x1="72" y1="58" x2="105" y2="58" stroke="#cbd5e1" strokeWidth="3.5" />
                  {circuit.I_total > 0 && (
                    <line x1="72" y1="58" x2="105" y2="58" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 8" className="flow-fwd" />
                  )}

                  {/* Distributor vertical trunk */}
                  <line x1="105" y1="58" x2="105" y2="162" stroke="#cbd5e1" strokeWidth="3.5" />
                  {circuit.I_bulb2 > 0 && (
                    <line x1="105" y1="58" x2="105" y2="162" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 8" className="flow-fwd" />
                  )}

                  {/* Branch 1 in: junction to Switch 1 */}
                  <line x1="105" y1="58" x2="140" y2="58" stroke="#cbd5e1" strokeWidth="3.5" />
                  {circuit.I_bulb1 > 0 && (
                    <line x1="105" y1="58" x2="140" y2="58" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 8" className="flow-fwd" />
                  )}

                  {/* Branch 1 mid: Switch 1 to Bulb 1 */}
                  <line x1="190" y1="58" x2="310" y2="58" stroke="#cbd5e1" strokeWidth="3.5" />
                  {circuit.I_bulb1 > 0 && (
                    <line x1="190" y1="58" x2="310" y2="58" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 8" className="flow-fwd" />
                  )}

                  {/* Branch 1 out: Bulb 1 to collector */}
                  <line x1="358" y1="58" x2="490" y2="58" stroke="#cbd5e1" strokeWidth="3.5" />
                  {circuit.I_bulb1 > 0 && (
                    <line x1="358" y1="58" x2="490" y2="58" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 8" className="flow-fwd" />
                  )}

                  {/* Branch 2 in: junction to Switch 2 */}
                  <line x1="105" y1="162" x2="140" y2="162" stroke="#cbd5e1" strokeWidth="3.5" />
                  {circuit.I_bulb2 > 0 && (
                    <line x1="105" y1="162" x2="140" y2="162" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 8" className="flow-fwd" />
                  )}

                  {/* Branch 2 mid: Switch 2 to Bulb 2 */}
                  <line x1="190" y1="162" x2="310" y2="162" stroke="#cbd5e1" strokeWidth="3.5" />
                  {circuit.I_bulb2 > 0 && (
                    <line x1="190" y1="162" x2="310" y2="162" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 8" className="flow-fwd" />
                  )}

                  {/* Branch 2 out: Bulb 2 to collector */}
                  <line x1="358" y1="162" x2="490" y2="162" stroke="#cbd5e1" strokeWidth="3.5" />
                  {circuit.I_bulb2 > 0 && (
                    <line x1="358" y1="162" x2="490" y2="162" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 8" className="flow-fwd" />
                  )}

                  {/* Collector rail drops down and returns to Battery (-) */}
                  <path d="M 490 58 L 490 200 L 72 200 L 72 162" fill="none" stroke="#cbd5e1" strokeWidth="3.5" />
                  {circuit.I_total > 0 && (
                    <path d="M 490 58 L 490 200 L 72 200 L 72 162" fill="none" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 8" className="flow-fwd" />
                  )}

                  {/* Junction solder points */}
                  <circle cx="105" cy="58" r="4" fill="#0f172a" />
                  <circle cx="105" cy="162" r="4" fill="#0f172a" />
                  <circle cx="490" cy="58" r="4" fill="#0f172a" />
                  <circle cx="490" cy="162" r="4" fill="#0f172a" />
                </g>
              )}

              {/* ====================================================
                  BATTERY UNIT (Left)
                  ==================================================== */}
              <g transform="translate(18, 30)">
                {/* Enclosure */}
                <rect x="0" y="0" width="54" height="158" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />

                {/* (+) Terminal */}
                <circle cx="54" cy="28" r="6" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
                <text x="27" y="33" textAnchor="middle" fontSize="13" fontWeight="900" fill="#ef4444">
                  +
                </text>

                {/* (−) Terminal */}
                <circle cx="54" cy="132" r="6" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
                <text x="27" y="137" textAnchor="middle" fontSize="15" fontWeight="900" fill="#3b82f6">
                  −
                </text>

                {/* Center EMF label */}
                <text x="27" y="70" textAnchor="middle" fontSize="13" fontWeight="800" fill="#f8fafc">
                  {vSource} V
                </text>
                <text x="27" y="84" textAnchor="middle" fontSize="9" fontWeight="600" fill="#94a3b8">
                  BATTERY
                </text>

                {/* Direct Voltage Increment / Decrement Buttons */}
                <g
                  className="clickable-knob"
                  onClick={() => {
                    setVSource((v) => Math.max(0, v - 1));
                    setLastAction('voltage_changed');
                  }}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setVSource((v) => Math.max(0, v - 1));
                    }
                  }}
                  aria-label="Decrease battery voltage"
                >
                  <rect x="6" y="98" width="18" height="18" rx="3" fill="#1e293b" stroke="#475569" />
                  <text x="15" y="111" textAnchor="middle" fontSize="12" fontWeight="700" fill="#f8fafc">
                    −
                  </text>
                </g>
                <g
                  className="clickable-knob"
                  onClick={() => {
                    setVSource((v) => Math.min(24, v + 1));
                    setLastAction('voltage_changed');
                  }}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setVSource((v) => Math.min(24, v + 1));
                    }
                  }}
                  aria-label="Increase battery voltage"
                >
                  <rect x="30" y="98" width="18" height="18" rx="3" fill="#1e293b" stroke="#475569" />
                  <text x="39" y="111" textAnchor="middle" fontSize="12" fontWeight="700" fill="#f8fafc">
                    +
                  </text>
                </g>
              </g>

              {/* ====================================================
                  KNIFE SWITCH 1 (Upper Branch)
                  ==================================================== */}
              <g
                className="switch-group"
                onClick={toggleSwitch1}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSwitch1();
                  }
                }}
                aria-label={`Knife Switch 1: ${switch1}. Click to toggle.`}
              >
                {/* Switch Base plate (generous hit area) */}
                <rect
                  className="switch-base"
                  x="130"
                  y="34"
                  width="70"
                  height="48"
                  rx="5"
                  fill="#f8fafc"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />

                {/* Terminal posts */}
                <circle cx="140" cy="58" r="4.5" fill="#d97706" />
                <circle cx="190" cy="58" r="4.5" fill="#d97706" />

                {/* Blade geometry */}
                {switch1 === 'Closed' ? (
                  <g>
                    <line x1="140" y1="58" x2="190" y2="58" stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="185" y1="58" x2="198" y2="58" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                  </g>
                ) : (
                  <g>
                    <line x1="140" y1="58" x2="175" y2="38" stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="173" y1="39" x2="185" y2="32" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                  </g>
                )}

                {/* Switch Status Pill Label (>= 12px) */}
                <rect
                  x="132"
                  y="65"
                  width="66"
                  height="15"
                  rx="3"
                  fill={switch1 === 'Closed' ? '#dcfce7' : '#fee2e2'}
                />
                <text
                  x="165"
                  y="77"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill={switch1 === 'Closed' ? '#166534' : '#991b1b'}
                >
                  SW 1: {switch1}
                </text>
              </g>

              {/* ====================================================
                  KNIFE SWITCH 2 (Lower Branch)
                  ==================================================== */}
              <g
                className="switch-group"
                onClick={toggleSwitch2}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSwitch2();
                  }
                }}
                aria-label={`Knife Switch 2: ${switch2}. Click to toggle.`}
              >
                {/* Switch Base plate */}
                <rect
                  className="switch-base"
                  x="130"
                  y="138"
                  width="70"
                  height="48"
                  rx="5"
                  fill="#f8fafc"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />

                {/* Terminal posts */}
                <circle cx="140" cy="162" r="4.5" fill="#d97706" />
                <circle cx="190" cy="162" r="4.5" fill="#d97706" />

                {/* Blade geometry */}
                {switch2 === 'Closed' ? (
                  <g>
                    <line x1="140" y1="162" x2="190" y2="162" stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="185" y1="162" x2="198" y2="162" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                  </g>
                ) : (
                  <g>
                    <line x1="140" y1="162" x2="175" y2="142" stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="173" y1="143" x2="185" y2="136" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                  </g>
                )}

                {/* Switch Status Pill Label */}
                <rect
                  x="132"
                  y="169"
                  width="66"
                  height="15"
                  rx="3"
                  fill={switch2 === 'Closed' ? '#dcfce7' : '#fee2e2'}
                />
                <text
                  x="165"
                  y="181"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill={switch2 === 'Closed' ? '#166534' : '#991b1b'}
                >
                  SW 2: {switch2}
                </text>
              </g>

              {/* ====================================================
                  LIGHT BULB 1 (Upper Branch)
                  ==================================================== */}
              <g transform="translate(334, 58)">
                {/* Radiant Glow Halo */}
                {circuit.P_bulb1 > 0 && (
                  <circle
                    cx="0"
                    cy="0"
                    r={24 + (circuit.P_bulb1 / 24) * 22}
                    fill="url(#glow-b1)"
                  />
                )}

                {/* Glass Envelope */}
                <circle
                  cx="0"
                  cy="-4"
                  r="21"
                  fill={circuit.P_bulb1 > 0 ? '#fef9c3' : '#f8fafc'}
                  stroke={circuit.P_bulb1 > 0 ? '#f59e0b' : '#94a3b8'}
                  strokeWidth="1.5"
                />

                {/* Filament */}
                <path
                  d="M -6 4 Q -3 -8 0 -4 Q 3 -8 6 4"
                  fill="none"
                  stroke={circuit.P_bulb1 >= 18 ? '#ffffff' : circuit.P_bulb1 > 0 ? '#f59e0b' : '#64748b'}
                  strokeWidth={circuit.P_bulb1 > 0 ? 2.5 : 1.5}
                />

                {/* Socket and Contacts */}
                <rect x="-10" y="8" width="20" height="10" rx="2" fill="#64748b" stroke="#334155" />
                <circle cx="-24" cy="0" r="3.5" fill="#d97706" />
                <circle cx="24" cy="0" r="3.5" fill="#d97706" />

                {/* Clear Primary Bulb Metrics beside socket (>= 12px) */}
                <text x="36" y="-6" fontSize="13" fontWeight="800" fill="#0f172a">
                  Bulb 1: {circuit.P_bulb1.toFixed(1)} W
                </text>
                <text x="36" y="10" fontSize="11" fontWeight="600" fill="#64748b">
                  {circuit.V_bulb1.toFixed(1)} V · {circuit.I_bulb1.toFixed(2)} A
                </text>
              </g>

              {/* ====================================================
                  LIGHT BULB 2 (Lower Branch)
                  ==================================================== */}
              <g transform="translate(334, 162)">
                {/* Radiant Glow Halo */}
                {circuit.P_bulb2 > 0 && (
                  <circle
                    cx="0"
                    cy="0"
                    r={24 + (circuit.P_bulb2 / 24) * 22}
                    fill="url(#glow-b2)"
                  />
                )}

                {/* Glass Envelope */}
                <circle
                  cx="0"
                  cy="-4"
                  r="21"
                  fill={circuit.P_bulb2 > 0 ? '#fef9c3' : '#f8fafc'}
                  stroke={circuit.P_bulb2 > 0 ? '#f59e0b' : '#94a3b8'}
                  strokeWidth="1.5"
                />

                {/* Filament */}
                <path
                  d="M -6 4 Q -3 -8 0 -4 Q 3 -8 6 4"
                  fill="none"
                  stroke={circuit.P_bulb2 >= 18 ? '#ffffff' : circuit.P_bulb2 > 0 ? '#f59e0b' : '#64748b'}
                  strokeWidth={circuit.P_bulb2 > 0 ? 2.5 : 1.5}
                />

                {/* Socket and Contacts */}
                <rect x="-10" y="8" width="20" height="10" rx="2" fill="#64748b" stroke="#334155" />
                <circle cx="-24" cy="0" r="3.5" fill="#d97706" />
                <circle cx="24" cy="0" r="3.5" fill="#d97706" />

                {/* Clear Primary Bulb Metrics beside socket */}
                <text x="36" y="-6" fontSize="13" fontWeight="800" fill="#0f172a">
                  Bulb 2: {circuit.P_bulb2.toFixed(1)} W
                </text>
                <text x="36" y="10" fontSize="11" fontWeight="600" fill="#64748b">
                  {circuit.V_bulb2.toFixed(1)} V · {circuit.I_bulb2.toFixed(2)} A
                </text>
              </g>
            </svg>
          </div>
        </div>

        <ModelNotes>
          <strong>Series and Parallel Resistive Circuit Model:</strong>
          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
            <li>
              <strong>Series Loop:</strong> Bulbs share one sequential pathway. Total resistance is R_eq = R1 + R2 = 2·R. Identical current flows through all components: I = V / (2·R). Each bulb receives half the battery voltage (V/2), dissipating P = (V/2)² / R = V² / (4·R). Opening either switch opens the whole circuit.
            </li>
            <li>
              <strong>Parallel Ladder:</strong> Each branch connects directly across the battery terminals. Each active bulb receives the full voltage V, dissipating P = V² / R (4× the power of the series connection for identical bulbs). Opening one switch isolates only that branch; the other branch continues operating completely unaffected.
            </li>
            <li>
              <strong>Assumptions:</strong> Filament resistance R is ideal and constant (temperature coefficient α = 0). The battery is an ideal DC source with zero internal resistance. Connecting wires have zero resistance.
            </li>
          </ul>
        </ModelNotes>
      </div>
    </SimFrame>
  );
}

render(<ConceptSimulation />);
