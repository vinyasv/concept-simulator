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

  const toggleTopology = (mode) => {
    setTopology(mode);
    setLastAction(`topology_${mode.toLowerCase()}`);
  };

  const explanation = React.useMemo(() => {
    if (lastAction === 'init') {
      return "Observe the bulbs in Series at 6.0 W each: click either knife switch to break the loop, or flip the wiring to Parallel.";
    }
    if (lastAction === 'reset') {
      return `Restored initial Series loop with both switches closed at ${vSource} V; each bulb shares half the source electromotive force.`;
    }
    if (lastAction === 'sw1_open') {
      if (topology === 'Series') {
        return "Opening Switch 1 broke the single series conduction loop: current ceased everywhere (0.00 A) and both bulbs went dark.";
      } else {
        return `Opening Switch 1 isolated Branch 1 (0.0 W), but Branch 2 remains connected across ${vSource} V and Bulb 2 shines unaffected at ${circuit.P_bulb2.toFixed(1)} W.`;
      }
    }
    if (lastAction === 'sw1_closed') {
      if (topology === 'Series') {
        return `Switch 1 closed, re-establishing the sequential loop: ${circuit.I_total.toFixed(2)} A flows through both bulbs at ${circuit.P_bulb1.toFixed(1)} W each.`;
      } else {
        return `Switch 1 closed, reconnecting Branch 1: Bulb 1 draws ${circuit.I_bulb1.toFixed(2)} A at ${circuit.P_bulb1.toFixed(1)} W directly from the source.`;
      }
    }
    if (lastAction === 'sw2_open') {
      if (topology === 'Series') {
        return "Opening Switch 2 broke the return path of the series loop: current halted throughout the circuit and both filaments cooled.";
      } else {
        return `Opening Switch 2 isolated Branch 2 (0.0 W), but Branch 1 maintains its independent closed loop, powering Bulb 1 at ${circuit.P_bulb1.toFixed(1)} W.`;
      }
    }
    if (lastAction === 'sw2_closed') {
      if (topology === 'Series') {
        return `Switch 2 closed, completing the single sequential circuit: current of ${circuit.I_total.toFixed(2)} A powers both bulbs at ${circuit.P_bulb2.toFixed(1)} W each.`;
      } else {
        return `Switch 2 closed, re-energizing Branch 2: Bulb 2 dissipates ${circuit.P_bulb2.toFixed(1)} W independently across ${vSource} V.`;
      }
    }
    if (lastAction === 'topology_series') {
      return `Switched to Series: bulbs are chained in sequence, dividing the ${vSource} V battery voltage to ${circuit.V_bulb1.toFixed(1)} V each and dissipating ${circuit.P_bulb1.toFixed(1)} W.`;
    }
    if (lastAction === 'topology_parallel') {
      return `Switched to Parallel: each bulb receives the full ${vSource} V across its branch, quadrupling filament power to ${circuit.P_bulb1.toFixed(1)} W without increasing battery voltage!`;
    }
    return `Source electromotive force set to ${vSource} V: total current is ${circuit.I_total.toFixed(2)} A with equivalent resistance of ${circuit.R_eq === Infinity ? '∞' : circuit.R_eq.toFixed(1)} Ω.`;
  }, [lastAction, topology, circuit, vSource]);

  // Glow radius and opacity based on bulb power
  const glow1Radius = circuit.P_bulb1 > 0 ? 22 + (circuit.P_bulb1 / 24) * 38 : 0;
  const glow1Opacity = circuit.P_bulb1 > 0 ? 0.35 + (circuit.P_bulb1 / 24) * 0.65 : 0;
  const glow2Radius = circuit.P_bulb2 > 0 ? 22 + (circuit.P_bulb2 / 24) * 38 : 0;
  const glow2Opacity = circuit.P_bulb2 > 0 ? 0.35 + (circuit.P_bulb2 / 24) * 0.65 : 0;

  // Animation durations inversely proportional to current
  const totalFlowSpeed = circuit.I_total > 0 ? Math.max(0.4, 2.0 / circuit.I_total).toFixed(2) : 0;
  const b1FlowSpeed = circuit.I_bulb1 > 0 ? Math.max(0.4, 2.0 / circuit.I_bulb1).toFixed(2) : 0;
  const b2FlowSpeed = circuit.I_bulb2 > 0 ? Math.max(0.4, 2.0 / circuit.I_bulb2).toFixed(2) : 0;

  return (
    <SimFrame
      title="Series and Parallel Circuits Exploration"
      description="Discover how circuit topology dictates current distribution, branch independence, and bulb dissipation."
      controls={
        <>
          <Control label="DC Battery EMF" value={`${vSource} V`}>
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
          <Control label="Bulb Filament Resistance" value={`${rBulb} Ω`}>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={rBulb}
              onChange={(e) => {
                setRBulb(Number(e.target.value));
                setLastAction('resistance_changed');
              }}
              aria-label="Bulb filament resistance in ohms"
            />
          </Control>
          <Control label="Wiring Topology" value={topology}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => toggleTopology('Series')}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: topology === 'Series' ? 'bold' : 'normal',
                  background: topology === 'Series' ? '#0f172a' : '#f1f5f9',
                  color: topology === 'Series' ? '#ffffff' : '#334155',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer'
                }}
              >
                Series
              </button>
              <button
                type="button"
                onClick={() => toggleTopology('Parallel')}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: topology === 'Parallel' ? 'bold' : 'normal',
                  background: topology === 'Parallel' ? '#0f172a' : '#f1f5f9',
                  color: topology === 'Parallel' ? '#ffffff' : '#334155',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer'
                }}
              >
                Parallel
              </button>
            </div>
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
          boxSizing: 'border-box'
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
          {/* Explanation bar with responsive font */}
          <div
            style={{
              padding: '6px 10px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <p
              className="sim-explanation"
              style={{
                margin: 0,
                fontSize: '13px',
                color: '#334155',
                lineHeight: 1.35,
                fontWeight: 500
              }}
            >
              {explanation}
            </p>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                background: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              title="Restore default Series configuration"
            >
              ↺ Reset
            </button>
          </div>

          {/* Main Visual SVG Workspace */}
          <div
            className="sim-visual-area"
            style={{
              flex: 1,
              minHeight: 0,
              position: 'relative',
              background: '#ffffff'
            }}
          >
            <svg
              viewBox="0 0 760 410"
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
              style={{ display: 'block' }}
            >
              <defs>
                <style>{`
                  @keyframes flow-forward {
                    from { stroke-dashoffset: 24; }
                    to { stroke-dashoffset: 0; }
                  }
                  @keyframes flow-backward {
                    from { stroke-dashoffset: 0; }
                    to { stroke-dashoffset: 24; }
                  }
                  .charge-dot-tot {
                    animation: flow-forward ${totalFlowSpeed}s linear infinite;
                  }
                  .charge-dot-rev {
                    animation: flow-backward ${totalFlowSpeed}s linear infinite;
                  }
                  .charge-dot-b1 {
                    animation: flow-forward ${b1FlowSpeed}s linear infinite;
                  }
                  .charge-dot-b2 {
                    animation: flow-forward ${b2FlowSpeed}s linear infinite;
                  }
                  .switch-btn:hover {
                    opacity: 0.85;
                  }
                `}</style>

                {/* Glow Radial Gradients for Bulbs */}
                <radialGradient id="glow-bulb1" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={glow1Opacity} />
                  <stop offset="35%" stopColor="#fef08a" stopOpacity={glow1Opacity * 0.85} />
                  <stop offset="70%" stopColor="#f59e0b" stopOpacity={glow1Opacity * 0.45} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </radialGradient>

                <radialGradient id="glow-bulb2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={glow2Opacity} />
                  <stop offset="35%" stopColor="#fef08a" stopOpacity={glow2Opacity * 0.85} />
                  <stop offset="70%" stopColor="#f59e0b" stopOpacity={glow2Opacity * 0.45} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </radialGradient>
              </defs>

              {/* Grid backdrop for authentic bench feel */}
              <pattern id="bench-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              </pattern>
              <rect x="0" y="0" width="760" height="410" fill="url(#bench-grid)" />

              {/* Canvas Interactive Mode Selector Header */}
              <g transform="translate(180, 16)">
                <rect x="0" y="0" width="370" height="34" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                <text x="75" y="21" textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">
                  HARNESS TOPOLOGY:
                </text>
                {/* Series Button */}
                <g
                  onClick={() => toggleTopology('Series')}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTopology('Series'); }}
                  aria-label="Select Series loop topology"
                >
                  <rect
                    x="150"
                    y="4"
                    width="100"
                    height="26"
                    rx="4"
                    fill={topology === 'Series' ? '#0f172a' : '#ffffff'}
                    stroke={topology === 'Series' ? '#0f172a' : '#cbd5e1'}
                  />
                  <text
                    x="200"
                    y="21"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={topology === 'Series' ? '#ffffff' : '#334155'}
                  >
                    ⚡ Series Loop
                  </text>
                </g>
                {/* Parallel Button */}
                <g
                  onClick={() => toggleTopology('Parallel')}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTopology('Parallel'); }}
                  aria-label="Select Parallel ladder topology"
                >
                  <rect
                    x="256"
                    y="4"
                    width="108"
                    height="26"
                    rx="4"
                    fill={topology === 'Parallel' ? '#0f172a' : '#ffffff'}
                    stroke={topology === 'Parallel' ? '#0f172a' : '#cbd5e1'}
                  />
                  <text
                    x="310"
                    y="21"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={topology === 'Parallel' ? '#ffffff' : '#334155'}
                  >
                    ⚡ Parallel Ladder
                  </text>
                </g>
              </g>

              {/* ========================================================
                  COPPER WIRING HARNESS (Changes by topology)
                  ======================================================== */}
              {topology === 'Series' ? (
                // SERIES TOPOLOGY WIRES
                <g id="series-harness">
                  {/* Top Wire: Battery (+) to Switch 1 */}
                  <line x1="110" y1="140" x2="205" y2="140" stroke="#94a3b8" strokeWidth="4" />
                  {circuit.I_total > 0 && (
                    <line
                      x1="110"
                      y1="140"
                      x2="205"
                      y2="140"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="4 8"
                      className="charge-dot-tot"
                    />
                  )}

                  {/* Wire: Switch 1 to Bulb 1 */}
                  <line x1="255" y1="140" x2="375" y2="140" stroke="#94a3b8" strokeWidth="4" />
                  {circuit.I_total > 0 && (
                    <line
                      x1="255"
                      y1="140"
                      x2="375"
                      y2="140"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="4 8"
                      className="charge-dot-tot"
                    />
                  )}

                  {/* Turn wire: Bulb 1 right to right bus, drops to Bulb 2 right */}
                  <path d="M 445 140 L 510 140 L 510 260 L 445 260" fill="none" stroke="#94a3b8" strokeWidth="4" />
                  {circuit.I_total > 0 && (
                    <path
                      d="M 445 140 L 510 140 L 510 260 L 445 260"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="4 8"
                      className="charge-dot-tot"
                    />
                  )}

                  {/* Wire: Bulb 2 left to Switch 2 right */}
                  <line x1="375" y1="260" x2="255" y2="260" stroke="#94a3b8" strokeWidth="4" />
                  {circuit.I_total > 0 && (
                    <line
                      x1="375"
                      y1="260"
                      x2="255"
                      y2="260"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="4 8"
                      className="charge-dot-rev"
                    />
                  )}

                  {/* Return Wire: Switch 2 left to Battery (-) */}
                  <line x1="205" y1="260" x2="110" y2="260" stroke="#94a3b8" strokeWidth="4" />
                  {circuit.I_total > 0 && (
                    <line
                      x1="205"
                      y1="260"
                      x2="110"
                      y2="260"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="4 8"
                      className="charge-dot-rev"
                    />
                  )}
                </g>
              ) : (
                // PARALLEL TOPOLOGY WIRES
                <g id="parallel-harness">
                  {/* Positive supply trunk: Battery (+) to distributor junction */}
                  <line x1="110" y1="140" x2="155" y2="140" stroke="#94a3b8" strokeWidth="4" />
                  {circuit.I_total > 0 && (
                    <line
                      x1="110"
                      y1="140"
                      x2="155"
                      y2="140"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="4 8"
                      className="charge-dot-tot"
                    />
                  )}

                  {/* Distributor vertical bus: feeds Branch 1 and Branch 2 */}
                  <line x1="155" y1="140" x2="155" y2="260" stroke="#94a3b8" strokeWidth="4" />
                  {circuit.I_bulb2 > 0 && (
                    <line
                      x1="155"
                      y1="140"
                      x2="155"
                      y2="260"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="4 8"
                      className="charge-dot-b2"
                    />
                  )}

                  {/* Branch 1 Input: distributor to Switch 1 */}
                  <line x1="155" y1="140" x2="205" y2="140" stroke="#94a3b8" strokeWidth="4" />
                  {circuit.I_bulb1 > 0 && (
                    <line
                      x1="155"
                      y1="140"
                      x2="205"
                      y2="140"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="4 8"
                      className="charge-dot-b1"
                    />
                  )}

                  {/* Branch 1 Mid: Switch 1 to Bulb 1 */}
                  <line x1="255" y1="140" x2="375" y2="140" stroke="#94a3b8" strokeWidth="4" />
                  {circuit.I_bulb1 > 0 && (
                    <line
                      x1="255"
                      y1="140"
                      x2="375"
                      y2="140"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="4 8"
                      className="charge-dot-b1"
                    />
                  )}

                  {/* Branch 1 Output: Bulb 1 to collector */}
                  <line x1="445" y1="140" x2="510" y2="140" stroke="#94a3b8" strokeWidth="4" />
                  {circuit.I_bulb1 > 0 && (
                    <line
                      x1="445"
                      y1="140"
                      x2="510"
                      y2="140"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="4 8"
                      className="charge-dot-b1"
                    />
                  )}

                  {/* Branch 2 Input: distributor to Switch 2 */}
                  <line x1="155" y1="260" x2="205" y2="260" stroke="#94a3b8" strokeWidth="4" />
                  {circuit.I_bulb2 > 0 && (
                    <line
                      x1="155"
                      y1="260"
                      x2="205"
                      y2="260"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="4 8"
                      className="charge-dot-b2"
                    />
                  )}

                  {/* Branch 2 Mid: Switch 2 to Bulb 2 */}
                  <line x1="255" y1="260" x2="375" y2="260" stroke="#94a3b8" strokeWidth="4" />
                  {circuit.I_bulb2 > 0 && (
                    <line
                      x1="255"
                      y1="260"
                      x2="375"
                      y2="260"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="4 8"
                      className="charge-dot-b2"
                    />
                  )}

                  {/* Branch 2 Output: Bulb 2 to collector */}
                  <line x1="445" y1="260" x2="510" y2="260" stroke="#94a3b8" strokeWidth="4" />
                  {circuit.I_bulb2 > 0 && (
                    <line
                      x1="445"
                      y1="260"
                      x2="510"
                      y2="260"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="4 8"
                      className="charge-dot-b2"
                    />
                  )}

                  {/* Collector rail drops down to bottom return trunk */}
                  <path d="M 510 140 L 510 330 L 110 330 L 110 260" fill="none" stroke="#94a3b8" strokeWidth="4" />
                  {circuit.I_total > 0 && (
                    <path
                      d="M 510 140 L 510 330 L 110 330 L 110 260"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="4 8"
                      className="charge-dot-tot"
                    />
                  )}

                  {/* Junction solder dots */}
                  <circle cx="155" cy="140" r="4.5" fill="#0f172a" />
                  <circle cx="155" cy="260" r="4.5" fill="#0f172a" />
                  <circle cx="510" cy="140" r="4.5" fill="#0f172a" />
                  <circle cx="510" cy="260" r="4.5" fill="#0f172a" />
                </g>
              )}

              {/* ========================================================
                  BATTERY UNIT (Left Anchor)
                  ======================================================== */}
              <g id="battery-unit" transform="translate(42, 105)">
                {/* Battery enclosure */}
                <rect x="0" y="0" width="68" height="190" rx="8" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                <rect x="5" y="5" width="58" height="180" rx="5" fill="#0f172a" opacity="0.4" />

                {/* Positive terminal (+) */}
                <circle cx="68" cy="35" r="7" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
                <text x="34" y="40" textAnchor="middle" fontSize="13" fontWeight="900" fill="#ef4444">
                  +
                </text>

                {/* Negative terminal (-) */}
                <circle cx="68" cy="155" r="7" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
                <text x="34" y="160" textAnchor="middle" fontSize="16" fontWeight="900" fill="#3b82f6">
                  −
                </text>

                {/* Center labels */}
                <text x="34" y="80" textAnchor="middle" fontSize="12" fontWeight="800" fill="#f8fafc">
                  {vSource} V
                </text>
                <text x="34" y="96" textAnchor="middle" fontSize="9" fontWeight="600" fill="#94a3b8" letterSpacing="0.5">
                  DC SOURCE
                </text>
                <text x="34" y="118" textAnchor="middle" fontSize="10" fontWeight="700" fill="#38bdf8">
                  {circuit.I_total.toFixed(2)} A
                </text>

                {/* Direct Manipulation Voltage +/- buttons beside battery */}
                <g
                  onClick={() => {
                    const next = Math.max(0, vSource - 1);
                    setVSource(next);
                    setLastAction('voltage_changed');
                  }}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setVSource(Math.max(0, vSource - 1)); }}
                  aria-label="Decrease battery voltage by 1 volt"
                >
                  <rect x="8" y="130" width="22" height="16" rx="3" fill="#334155" stroke="#475569" />
                  <text x="19" y="142" textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffffff">
                    −
                  </text>
                </g>
                <g
                  onClick={() => {
                    const next = Math.min(24, vSource + 1);
                    setVSource(next);
                    setLastAction('voltage_changed');
                  }}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setVSource(Math.min(24, vSource + 1)); }}
                  aria-label="Increase battery voltage by 1 volt"
                >
                  <rect x="38" y="130" width="22" height="16" rx="3" fill="#334155" stroke="#475569" />
                  <text x="49" y="142" textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffffff">
                    +
                  </text>
                </g>
              </g>

              {/* ========================================================
                  KNIFE SWITCH 1 (Upper Branch)
                  ======================================================== */}
              <g
                id="knife-switch-1"
                className="switch-btn"
                onClick={toggleSwitch1}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSwitch1(); }}
                aria-label={`Knife Switch 1 is currently ${switch1}. Click to toggle.`}
              >
                {/* Switch insulated base plate */}
                <rect x="196" y="122" width="68" height="36" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />

                {/* Brass terminal posts */}
                <circle cx="205" cy="140" r="5" fill="#d97706" stroke="#92400e" strokeWidth="1" />
                <circle cx="255" cy="140" r="5" fill="#d97706" stroke="#92400e" strokeWidth="1" />

                {/* Knife blade */}
                {switch1 === 'Closed' ? (
                  // Closed blade flat bridging contacts
                  <g>
                    <line x1="205" y1="140" x2="255" y2="140" stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="250" y1="140" x2="264" y2="140" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                  </g>
                ) : (
                  // Open blade pivoted at 38 degrees
                  <g>
                    <line x1="205" y1="140" x2="242" y2="114" stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="240" y1="115" x2="252" y2="106" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                    <text x="245" y="132" fontSize="9" fontWeight="700" fill="#dc2626">
                      OPEN
                    </text>
                  </g>
                )}

                {/* Switch status pill label */}
                <rect
                  x="196"
                  y="162"
                  width="68"
                  height="16"
                  rx="3"
                  fill={switch1 === 'Closed' ? '#dcfce7' : '#fee2e2'}
                  stroke={switch1 === 'Closed' ? '#86efac' : '#fca5a5'}
                />
                <text
                  x="230"
                  y="174"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="700"
                  fill={switch1 === 'Closed' ? '#166534' : '#991b1b'}
                >
                  SW 1: {switch1}
                </text>
              </g>

              {/* ========================================================
                  KNIFE SWITCH 2 (Lower Branch)
                  ======================================================== */}
              <g
                id="knife-switch-2"
                className="switch-btn"
                onClick={toggleSwitch2}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSwitch2(); }}
                aria-label={`Knife Switch 2 is currently ${switch2}. Click to toggle.`}
              >
                {/* Switch insulated base plate */}
                <rect x="196" y="242" width="68" height="36" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />

                {/* Brass terminal posts */}
                <circle cx="205" cy="260" r="5" fill="#d97706" stroke="#92400e" strokeWidth="1" />
                <circle cx="255" cy="260" r="5" fill="#d97706" stroke="#92400e" strokeWidth="1" />

                {/* Knife blade */}
                {switch2 === 'Closed' ? (
                  // Closed blade
                  <g>
                    <line x1="205" y1="260" x2="255" y2="260" stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="250" y1="260" x2="264" y2="260" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                  </g>
                ) : (
                  // Open blade
                  <g>
                    <line x1="205" y1="260" x2="242" y2="234" stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="240" y1="235" x2="252" y2="226" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                    <text x="245" y="252" fontSize="9" fontWeight="700" fill="#dc2626">
                      OPEN
                    </text>
                  </g>
                )}

                {/* Switch status pill label */}
                <rect
                  x="196"
                  y="282"
                  width="68"
                  height="16"
                  rx="3"
                  fill={switch2 === 'Closed' ? '#dcfce7' : '#fee2e2'}
                  stroke={switch2 === 'Closed' ? '#86efac' : '#fca5a5'}
                />
                <text
                  x="230"
                  y="294"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="700"
                  fill={switch2 === 'Closed' ? '#166534' : '#991b1b'}
                >
                  SW 2: {switch2}
                </text>
              </g>

              {/* ========================================================
                  LIGHT BULB 1 (Socket 1, Upper Branch)
                  ======================================================== */}
              <g id="bulb-unit-1">
                {/* Radiant Glow Halo (dissipated power scaled) */}
                {circuit.P_bulb1 > 0 && (
                  <circle
                    cx="410"
                    cy="140"
                    r={glow1Radius}
                    fill="url(#glow-bulb1)"
                    style={{ transition: 'r 0.25s ease-out' }}
                  />
                )}

                {/* Bulb Socket and threaded base */}
                <rect x="398" y="148" width="24" height="14" rx="2" fill="#64748b" stroke="#334155" strokeWidth="1" />
                <line x1="398" y1="152" x2="422" y2="152" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="398" y1="157" x2="422" y2="157" stroke="#cbd5e1" strokeWidth="1" />
                <circle cx="375" cy="140" r="4" fill="#d97706" />
                <circle cx="445" cy="140" r="4" fill="#d97706" />

                {/* Glass Envelope */}
                <circle
                  cx="410"
                  cy="132"
                  r="21"
                  fill={circuit.P_bulb1 > 0 ? 'rgba(254, 240, 138, 0.2)' : 'rgba(241, 245, 249, 0.4)'}
                  stroke={circuit.P_bulb1 > 0 ? '#f59e0b' : '#94a3b8'}
                  strokeWidth="1.5"
                />

                {/* Filament support posts */}
                <line x1="405" y1="148" x2="405" y2="136" stroke="#475569" strokeWidth="1" />
                <line x1="415" y1="148" x2="415" y2="136" stroke="#475569" strokeWidth="1" />

                {/* Coiled tungsten filament */}
                <path
                  d="M 405 136 Q 407 125 410 130 Q 413 125 415 136"
                  fill="none"
                  stroke={
                    circuit.P_bulb1 >= 20 ? '#ffffff' :
                    circuit.P_bulb1 > 0 ? '#fef08a' : '#64748b'
                  }
                  strokeWidth={circuit.P_bulb1 >= 20 ? 3.5 : circuit.P_bulb1 > 0 ? 2.5 : 1.5}
                  strokeLinecap="round"
                />

                {/* Bulb 1 Electrical Metrics Badge */}
                <g transform="translate(340, 172)">
                  <rect x="0" y="0" width="140" height="34" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="70" y="14" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">
                    BULB 1: {circuit.P_bulb1.toFixed(1)} W
                  </text>
                  <text x="70" y="27" textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748b">
                    {circuit.V_bulb1.toFixed(1)} V · {circuit.I_bulb1.toFixed(2)} A · {rBulb} Ω
                  </text>
                </g>
              </g>

              {/* ========================================================
                  LIGHT BULB 2 (Socket 2, Lower Branch)
                  ======================================================== */}
              <g id="bulb-unit-2">
                {/* Radiant Glow Halo */}
                {circuit.P_bulb2 > 0 && (
                  <circle
                    cx="410"
                    cy="260"
                    r={glow2Radius}
                    fill="url(#glow-bulb2)"
                    style={{ transition: 'r 0.25s ease-out' }}
                  />
                )}

                {/* Bulb Socket and threaded base */}
                <rect x="398" y="268" width="24" height="14" rx="2" fill="#64748b" stroke="#334155" strokeWidth="1" />
                <line x1="398" y1="272" x2="422" y2="272" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="398" y1="277" x2="422" y2="277" stroke="#cbd5e1" strokeWidth="1" />
                <circle cx="375" cy="260" r="4" fill="#d97706" />
                <circle cx="445" cy="260" r="4" fill="#d97706" />

                {/* Glass Envelope */}
                <circle
                  cx="410"
                  cy="252"
                  r="21"
                  fill={circuit.P_bulb2 > 0 ? 'rgba(254, 240, 138, 0.2)' : 'rgba(241, 245, 249, 0.4)'}
                  stroke={circuit.P_bulb2 > 0 ? '#f59e0b' : '#94a3b8'}
                  strokeWidth="1.5"
                />

                {/* Filament support posts */}
                <line x1="405" y1="268" x2="405" y2="256" stroke="#475569" strokeWidth="1" />
                <line x1="415" y1="268" x2="415" y2="256" stroke="#475569" strokeWidth="1" />

                {/* Coiled tungsten filament */}
                <path
                  d="M 405 256 Q 407 245 410 250 Q 413 245 415 256"
                  fill="none"
                  stroke={
                    circuit.P_bulb2 >= 20 ? '#ffffff' :
                    circuit.P_bulb2 > 0 ? '#fef08a' : '#64748b'
                  }
                  strokeWidth={circuit.P_bulb2 >= 20 ? 3.5 : circuit.P_bulb2 > 0 ? 2.5 : 1.5}
                  strokeLinecap="round"
                />

                {/* Bulb 2 Electrical Metrics Badge */}
                <g transform="translate(340, 292)">
                  <rect x="0" y="0" width="140" height="34" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="70" y="14" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">
                    BULB 2: {circuit.P_bulb2.toFixed(1)} W
                  </text>
                  <text x="70" y="27" textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748b">
                    {circuit.V_bulb2.toFixed(1)} V · {circuit.I_bulb2.toFixed(2)} A · {rBulb} Ω
                  </text>
                </g>
              </g>

              {/* ========================================================
                  DIGITAL MULTIMETER BENCH MONITOR (Right Side Panel)
                  ======================================================== */}
              <g id="multimeter-panel" transform="translate(560, 68)">
                <rect x="0" y="0" width="180" height="310" rx="8" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />

                {/* Header */}
                <rect x="10" y="10" width="160" height="34" rx="5" fill="#1e293b" />
                <text x="90" y="26" textAnchor="middle" fontSize="11" fontWeight="800" fill="#38bdf8" letterSpacing="0.5">
                  CIRCUIT ANALYZER
                </text>
                <text x="90" y="38" textAnchor="middle" fontSize="9" fontWeight="600" fill="#94a3b8">
                  Topology: {topology}
                </text>

                {/* Equivalent Resistance Display */}
                <rect x="10" y="52" width="160" height="46" rx="5" fill="#1e293b" />
                <text x="20" y="68" fontSize="9.5" fontWeight="700" fill="#94a3b8">
                  EQUIVALENT RESISTANCE (R_eq)
                </text>
                <text x="20" y="88" fontSize="16" fontWeight="900" fill="#f8fafc">
                  {circuit.R_eq === Infinity ? '∞ (Open Loop)' : `${circuit.R_eq.toFixed(1)} Ω`}
                </text>

                {/* Total Current Display */}
                <rect x="10" y="104" width="160" height="46" rx="5" fill="#1e293b" />
                <text x="20" y="120" fontSize="9.5" fontWeight="700" fill="#94a3b8">
                  TOTAL DC CURRENT (I_tot)
                </text>
                <text x="20" y="140" fontSize="16" fontWeight="900" fill="#38bdf8">
                  {circuit.I_total.toFixed(2)} A
                </text>

                {/* Branch Independence Comparison Card */}
                <rect x="10" y="156" width="160" height="74" rx="5" fill="#1e293b" />
                <text x="20" y="172" fontSize="9.5" fontWeight="700" fill="#94a3b8">
                  BRANCH DISSIPATION
                </text>
                <text x="20" y="190" fontSize="11" fontWeight="600" fill="#f8fafc">
                  Bulb 1: <tspan fontWeight="800" fill="#fbbf24">{circuit.P_bulb1.toFixed(1)} W</tspan>
                </text>
                <text x="20" y="206" fontSize="11" fontWeight="600" fill="#f8fafc">
                  Bulb 2: <tspan fontWeight="800" fill="#fbbf24">{circuit.P_bulb2.toFixed(1)} W</tspan>
                </text>
                <text x="20" y="222" fontSize="10" fontWeight="700" fill="#4ade80">
                  Total: {(circuit.P_bulb1 + circuit.P_bulb2).toFixed(1)} W
                </text>

                {/* Analytical Insight formula callout */}
                <rect x="10" y="236" width="160" height="64" rx="5" fill="#1e293b" />
                <text x="20" y="252" fontSize="9" fontWeight="700" fill="#cbd5e1">
                  PHYSICS PRINCIPLE:
                </text>
                <text x="20" y="267" fontSize="9.5" fontWeight="600" fill="#94a3b8">
                  {topology === 'Series'
                    ? 'P = I²·R = (1 A)²·6Ω = 6 W'
                    : 'P = V²/R = (12 V)²/6Ω = 24 W'}
                </text>
                <text x="20" y="284" fontSize="9" fontWeight="500" fill="#38bdf8">
                  {topology === 'Series'
                    ? 'Voltage shared: 6 V + 6 V = 12 V'
                    : '4× power per bulb without new battery!'}
                </text>
              </g>

              {/* Interaction Callout Hints */}
              <g transform="translate(196, 368)">
                <text x="0" y="0" fontSize="10" fontWeight="600" fill="#64748b">
                  💡 Hint: Click knife switches directly to break branches; watch how Series extinguishes both while Parallel preserves the second.
                </text>
              </g>
            </svg>
          </div>
        </div>

        <ModelNotes>
          <strong>Series and Parallel Resistive Circuit Model:</strong>
          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
            <li>
              <strong>Series Connection:</strong> Bulbs are chained along a single loop. Total resistance is R_eq = R1 + R2 = 2·R. Current is identical everywhere: I = V / (2·R). Each identical bulb drops V/2, dissipating P = (V/2)² / R = V² / (4·R). Opening any switch breaks the complete loop, halting all conduction.
            </li>
            <li>
              <strong>Parallel Connection:</strong> Each bulb forms an independent conduction rung across the full source electromotive force: V_bulb = V. Branch current is I_branch = V / R. Power dissipation quadruples to P = V² / R. Opening one branch has zero effect on the voltage or current of the companion branch.
            </li>
            <li>
              <strong>Assumptions:</strong> Filaments are modeled as constant linear ohmic resistors (temperature coefficient α = 0). The battery is an ideal DC source with zero internal resistance. Wires and closed switches possess zero resistance.
            </li>
          </ul>
        </ModelNotes>
      </div>
    </SimFrame>
  );
}

render(<ConceptSimulation />);