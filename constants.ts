import { LibraryCategory, FileData } from './types';

export const GEMINI_MODEL_REASONING = 'gemini-3-flash-preview';
export const GEMINI_MODEL_ASSETS = 'gemini-3-pro-image-preview';

export const INITIAL_CODE_STUB = `
// Simulation Container
const ConceptSimulation = () => {
  return (
    <div className="flex items-center justify-center h-full w-full bg-white text-black font-sans">
      <div className="text-center">
        <div className="border border-[#E0E0E0] p-8 inline-block bg-[#F9F9F9]">
            <p className="text-sm font-bold uppercase tracking-wider mb-2">Ready for Input</p>
            <p className="text-xs text-neutral-500 font-mono">Select a concept from the library or upload a file to begin analysis.</p>
        </div>
      </div>
    </div>
  );
};

render(<ConceptSimulation />);
`;

// --- CACHED SIMULATIONS ---

const PROJECTILE_CODE = `
const ProjectileSim = () => {
  const [v0, setV0] = React.useState(50);
  const [theta, setTheta] = React.useState(45);
  const [g, setG] = React.useState(9.8);
  
  const data = React.useMemo(() => {
    const d = [];
    const rad = theta * Math.PI / 180;
    const tTotal = (2 * v0 * Math.sin(rad)) / g;
    
    for(let t=0; t<=tTotal; t+=tTotal/50) {
      d.push({
        t: t.toFixed(2),
        x: v0 * Math.cos(rad) * t,
        y: v0 * Math.sin(rad) * t - 0.5 * g * t * t
      });
    }
    return d;
  }, [v0, theta, g]);

  return (
    <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
      <div className="border-b border-[#E0E0E0] pb-4">
        <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Projectile Kinematics</h2>
        <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
            Simulates the parabolic trajectory of an object under gravity. Adjusting velocity (v0) and angle affects the range and maximum height, governed by the kinematic equations of motion neglecting air resistance.
        </p>
      </div>
      <div className="flex gap-4 border-b border-[#E0E0E0] pb-4">
        <div className="flex flex-col">
          <label>Velocity (v0): {v0}</label>
          <input type="range" min="1" max="100" value={v0} onChange={e=>setV0(Number(e.target.value))} />
        </div>
        <div className="flex flex-col">
          <label>Angle (deg): {theta}</label>
          <input type="range" min="1" max="90" value={theta} onChange={e=>setTheta(Number(e.target.value))} />
        </div>
        <div className="flex flex-col">
          <label>Gravity: {g}</label>
          <input type="range" min="1" max="20" value={g} onChange={e=>setG(Number(e.target.value))} />
        </div>
      </div>
      <div className="flex-1 min-h-[300px]">
        <Recharts.ResponsiveContainer width="100%" height="100%">
          <Recharts.LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <Recharts.CartesianGrid stroke="#eee" strokeDasharray="3 3" />
            <Recharts.XAxis dataKey="x" type="number" domain={[0, 'auto']} allowDataOverflow={false} tick={{fontSize: 10}} />
            <Recharts.YAxis dataKey="y" domain={[0, 'auto']} tick={{fontSize: 10}} />
            <Recharts.Tooltip contentStyle={{ fontSize: '10px', borderRadius: '0px', border: '1px solid #E0E0E0' }} />
            <Recharts.Line type="monotone" dataKey="y" stroke="#000" dot={false} strokeWidth={1.5} />
          </Recharts.LineChart>
        </Recharts.ResponsiveContainer>
      </div>
    </div>
  );
};
render(<ProjectileSim />);
`;

const NEWTON_LAWS_CODE = `
const NewtonLawsSim = () => {
  const [mass, setMass] = React.useState(5);
  const [force, setForce] = React.useState(20);
  const [velocity, setVelocity] = React.useState(0);
  const [position, setPosition] = React.useState(10);
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    let interval;
    if (running) {
      interval = setInterval(() => {
        setVelocity(v => {
            const a = force / mass;
            // Simple integration v = v0 + at
            return v + a * 0.05; 
        });
        setPosition(p => {
            // Update position
            let next = p + velocity * 0.05;
            // Boundary wrap for demo continuity
            if (next > 100) return 0;
            if (next < 0) return 100;
            return next;
        });
      }, 20);
    }
    return () => clearInterval(interval);
  }, [running, force, mass, velocity]);

  const acceleration = (force / mass).toFixed(2);

  return (
    <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
      <div className="border-b border-[#E0E0E0] pb-4">
        <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Newton's Second Law</h2>
        <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
            F = ma. An object's acceleration is determined by the net force acting on it and its mass. 
            Adjust the Force and Mass to see how they affect the object's acceleration and velocity.
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-4 border-b border-[#E0E0E0] pb-4">
         <div>
            <label>Net Force (N): {force}</label>
            <input type="range" min="-50" max="50" value={force} onChange={e=>setForce(Number(e.target.value))} className="w-full"/>
         </div>
         <div>
            <label>Mass (kg): {mass}</label>
            <input type="range" min="1" max="20" value={mass} onChange={e=>setMass(Number(e.target.value))} className="w-full"/>
         </div>
         <div className="flex items-end gap-2">
            <button onClick={()=>setRunning(!running)} className="bg-black text-white px-4 py-1 uppercase w-full hover:opacity-80 transition-opacity">
                {running ? 'Pause' : 'Simulate'}
            </button>
            <button 
                onClick={()=>{setRunning(false); setVelocity(0); setPosition(10);}} 
                className="border border-[#ccc] px-4 py-1 uppercase w-full hover:bg-gray-50 transition-colors"
            >
                Reset
            </button>
         </div>
      </div>

      <div className="flex justify-around items-center text-lg font-bold p-4 bg-[#F9F9F9] border border-[#E0E0E0]">
         <div className="flex flex-col items-center">
            <span className="text-[10px] text-[#757575] uppercase">Applied Force</span>
            <span>{force} N</span>
         </div>
         <div className="text-[#999] text-2xl">/</div>
         <div className="flex flex-col items-center">
            <span className="text-[10px] text-[#757575] uppercase">Mass</span>
            <span>{mass} kg</span>
         </div>
         <div className="text-[#999] text-2xl">=</div>
         <div className="flex flex-col items-center text-red-600">
            <span className="text-[10px] text-[#757575] uppercase">Acceleration</span>
            <span>{acceleration} m/s²</span>
         </div>
         <div className="w-px h-8 bg-[#ccc] mx-2"></div>
         <div className="flex flex-col items-center text-blue-600">
            <span className="text-[10px] text-[#757575] uppercase">Velocity</span>
            <span>{velocity.toFixed(1)} m/s</span>
         </div>
      </div>

      <div className="flex-1 bg-white border border-[#E0E0E0] relative overflow-hidden min-h-[200px] flex items-end">
          {/* Track marks */}
          <div className="absolute bottom-0 w-full h-full border-b border-[#ccc]" style={{backgroundImage: 'linear-gradient(to right, #f0f0f0 1px, transparent 1px)', backgroundSize: '50px 100%'}}></div>

          {/* Object */}
          <div 
            className="absolute bottom-10 w-16 h-16 bg-black flex items-center justify-center text-white font-bold transition-transform duration-75 shadow-lg z-10"
            style={{ 
                left: position + '%',
                width: Math.max(40, mass * 4) + 'px', 
                height: Math.max(40, mass * 4) + 'px'
            }} 
          >
             {mass}kg
          </div>
          
          {/* Force Vector Arrow */}
          {force !== 0 && (
              <div 
                className="absolute bottom-[calc(2.5rem+4px)] h-0.5 bg-red-600 transition-all duration-75 z-20 flex items-center"
                style={{ 
                    left: position + '%',
                    marginLeft: (Math.max(40, mass * 4) / 2) + 'px',
                    width: (Math.abs(force) * 3) + 'px',
                    transformOrigin: 'left center',
                    transform: force < 0 ? 'rotate(180deg)' : 'none'
                }}
              >
                  <div className="absolute right-0 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[8px] border-l-red-600"></div>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-red-600 whitespace-nowrap">F = {Math.abs(force)}N</div>
              </div>
          )}
          
          {/* Velocity Vector Arrow */}
          {Math.abs(velocity) > 0.1 && (
              <div 
                className="absolute bottom-[calc(2.5rem-15px)] h-0.5 bg-blue-500 transition-all duration-75 z-20 flex items-center opacity-70"
                style={{ 
                    left: position + '%',
                    marginLeft: (Math.max(40, mass * 4) / 2) + 'px',
                    width: (Math.abs(velocity) * 2) + 'px',
                    transformOrigin: 'left center',
                    transform: velocity < 0 ? 'rotate(180deg)' : 'none'
                }}
              >
                 <div className="absolute right-0 w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[6px] border-l-blue-500"></div>
              </div>
          )}
      </div>
    </div>
  );
};
render(<NewtonLawsSim />);
`;

const OHM_CODE = `
const OhmSim = () => {
  const [v, setV] = React.useState(12);
  const [r, setR] = React.useState(100);
  
  const i = (v / r).toFixed(3);
  const power = (v * (v/r)).toFixed(2);
  
  const data = React.useMemo(() => {
    const d = [];
    for(let volt=0; volt<=24; volt+=2) {
      d.push({ v: volt, i: volt/r });
    }
    return d;
  }, [r]);

  return (
    <div className="h-full w-full p-6 font-mono text-xs flex flex-col gap-6">
      <div className="border-b border-[#E0E0E0] pb-4">
        <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Ohm's Law & Power</h2>
        <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
            Demonstrates the linear relationship between Voltage (V) and Current (I) in a resistive circuit. 
            According to V=IR, increasing resistance decreases current for a fixed voltage.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div className="border border-[#E0E0E0] p-4">
            <h3 className="font-bold mb-4 border-b pb-2">CIRCUIT PARAMETERS</h3>
            <div className="space-y-4">
                <div>
                    <label className="block mb-1">Voltage (V): {v}V</label>
                    <input type="range" min="0" max="24" value={v} onChange={e=>setV(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                    <label className="block mb-1">Resistance (R): {r}Ω</label>
                    <input type="range" min="10" max="1000" value={r} onChange={e=>setR(Number(e.target.value))} className="w-full" />
                </div>
            </div>
        </div>
        <div className="border border-[#E0E0E0] p-4 flex flex-col justify-center items-center bg-[#F9F9F9]">
            <div className="text-4xl font-bold mb-2">{i} A</div>
            <div className="text-[#757575] uppercase tracking-widest">Current</div>
            <div className="mt-4 text-sm text-[#555555]">Power Dissipation: {power} W</div>
        </div>
      </div>
      <div className="flex-1 border border-[#E0E0E0] p-2 min-h-[300px]">
         <div className="absolute top-2 left-2 text-[10px] uppercase font-bold bg-white px-2">V-I Characteristic (R={r}Ω)</div>
         <Recharts.ResponsiveContainer width="100%" height="100%">
            <Recharts.LineChart data={data}>
                <Recharts.CartesianGrid strokeDasharray="3 3" />
                <Recharts.XAxis dataKey="v" label={{ value: 'Voltage (V)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <Recharts.YAxis label={{ value: 'Current (A)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Recharts.Tooltip />
                <Recharts.Line type="monotone" dataKey="i" stroke="#000" strokeWidth={2} dot />
            </Recharts.LineChart>
         </Recharts.ResponsiveContainer>
      </div>
    </div>
  );
};
render(<OhmSim />);
`;

const NEWTON_COOLING_CODE = `
const NewtonSim = () => {
  const [Tenv, setTenv] = React.useState(20);
  const [Tobj, setTobj] = React.useState(100);
  const [k, setK] = React.useState(0.1);

  const data = React.useMemo(() => {
    const d = [];
    for(let t=0; t<=60; t+=1) {
      const temp = Tenv + (Tobj - Tenv) * Math.exp(-k * t);
      d.push({ t, temp: Number(temp.toFixed(1)) });
    }
    return d;
  }, [Tenv, Tobj, k]);

  return (
    <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
        <div className="border-b border-[#E0E0E0] pb-4">
            <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Newton's Law of Cooling</h2>
            <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                Models how an object cools down to match its ambient temperature. The rate of cooling is proportional to the temperature difference; higher 'k' values mean faster cooling (better insulation means lower k).
            </p>
        </div>
        <div className="grid grid-cols-3 gap-4 border-b border-[#E0E0E0] pb-4">
            <div>
                <label>Env Temp (T_env): {Tenv}°</label>
                <input type="range" min="0" max="50" value={Tenv} onChange={e=>setTenv(Number(e.target.value))} className="w-full"/>
            </div>
            <div>
                <label>Initial Obj Temp (T_0): {Tobj}°</label>
                <input type="range" min="50" max="200" value={Tobj} onChange={e=>setTobj(Number(e.target.value))} className="w-full"/>
            </div>
             <div>
                <label>Cooling Constant (k): {k}</label>
                <input type="range" min="0.01" max="0.5" step="0.01" value={k} onChange={e=>setK(Number(e.target.value))} className="w-full"/>
            </div>
        </div>
        <div className="flex-1 min-h-[300px]">
             <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.LineChart data={data}>
                    <Recharts.CartesianGrid strokeDasharray="3 3" />
                    <Recharts.XAxis dataKey="t" label={{ value: 'Time (min)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                    <Recharts.YAxis domain={['auto', 'auto']} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Recharts.Tooltip />
                    <Recharts.Line type="monotone" dataKey="temp" stroke="#000" strokeWidth={2} dot={false} />
                    <Recharts.ReferenceLine y={Tenv} stroke="red" strokeDasharray="3 3" label={{ value: 'T_env', fontSize: 10, fill: 'red' }} />
                </Recharts.LineChart>
             </Recharts.ResponsiveContainer>
        </div>
    </div>
  );
};
render(<NewtonSim />);
`;

const SHM_CODE = `
const SHMSim = () => {
  const [A, setA] = React.useState(10);
  const [w, setW] = React.useState(2);
  const [phi, setPhi] = React.useState(0);

  const data = React.useMemo(() => {
    const d = [];
    for (let t = 0; t <= 10; t += 0.1) {
      d.push({
        t: t.toFixed(1),
        x: A * Math.cos(w * t + phi)
      });
    }
    return d;
  }, [A, w, phi]);

  return (
    <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
      <div className="border-b border-[#E0E0E0] pb-4">
        <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Simple Harmonic Motion</h2>
        <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
            Visualizes periodic motion (like a pendulum or spring). 
            Amplitude (A) controls height, Frequency (w) controls speed of oscillation, and Phase (phi) shifts the starting point.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 border-b border-[#E0E0E0] pb-4">
        <div><label>Amplitude (A): {A}</label><input className="w-full" type="range" min="1" max="20" value={A} onChange={e=>setA(Number(e.target.value))}/></div>
        <div><label>Frequency (w): {w}</label><input className="w-full" type="range" min="1" max="10" step="0.5" value={w} onChange={e=>setW(Number(e.target.value))}/></div>
        <div><label>Phase (phi): {phi}</label><input className="w-full" type="range" min="0" max="6.28" step="0.1" value={phi} onChange={e=>setPhi(Number(e.target.value))}/></div>
      </div>
      <div className="flex-1 min-h-[300px]">
        <Recharts.ResponsiveContainer width="100%" height="100%">
          <Recharts.LineChart data={data}>
             <Recharts.CartesianGrid strokeDasharray="3 3" />
             <Recharts.XAxis dataKey="t" />
             <Recharts.YAxis />
             <Recharts.Tooltip />
             <Recharts.Line type="monotone" dataKey="x" stroke="#000" dot={false} />
          </Recharts.LineChart>
        </Recharts.ResponsiveContainer>
      </div>
    </div>
  );
};
render(<SHMSim />);
`;

const SNELL_CODE = `
const SnellSim = () => {
  const [n1, setN1] = React.useState(1.0);
  const [n2, setN2] = React.useState(1.5);
  const [theta1, setTheta1] = React.useState(45);

  const rad = (d) => d * Math.PI / 180;
  const deg = (r) => r * 180 / Math.PI;

  const theta2 = deg(Math.asin((n1 * Math.sin(rad(theta1))) / n2));
  
  const cx = 150, cy = 150;
  const len = 100;
  
  const x1 = cx - len * Math.sin(rad(theta1));
  const y1 = cy - len * Math.cos(rad(theta1));
  
  const x2 = cx + len * Math.sin(rad(theta2));
  const y2 = cy + len * Math.cos(rad(theta2));

  return (
    <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
      <div className="border-b border-[#E0E0E0] pb-4">
        <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Snell's Law (Refraction)</h2>
        <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
            Calculates how light bends when entering a different medium (n1 to n2). 
            If light travels to a less dense medium at a steep enough angle, the formula returns NaN, indicating Total Internal Reflection.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 border-b border-[#E0E0E0] pb-4">
        <div><label>n1 (Source): {n1}</label><input className="w-full" type="range" min="1" max="2.5" step="0.1" value={n1} onChange={e=>setN1(Number(e.target.value))}/></div>
        <div><label>n2 (Dest): {n2}</label><input className="w-full" type="range" min="1" max="2.5" step="0.1" value={n2} onChange={e=>setN2(Number(e.target.value))}/></div>
        <div><label>Angle Inc (deg): {theta1}</label><input className="w-full" type="range" min="0" max="89" value={theta1} onChange={e=>setTheta1(Number(e.target.value))}/></div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-[#F9F9F9] border border-[#E0E0E0] relative min-h-[300px]">
         <div className="absolute top-2 left-2 p-2 bg-white border border-[#E0E0E0]">
            Angle of Refraction: {!isNaN(theta2) ? theta2.toFixed(2) + '°' : 'TIR'}
         </div>
         <svg width="300" height="300" viewBox="0 0 300 300">
            <rect x="0" y="0" width="300" height="150" fill="white" />
            <text x="10" y="20" fontSize="10" fill="#999">n1={n1}</text>
            <rect x="0" y="150" width="300" height="150" fill="#F0F0F0" />
             <text x="10" y="290" fontSize="10" fill="#999">n2={n2}</text>
            <line x1="150" y1="50" x2="150" y2="250" stroke="#ccc" strokeDasharray="4 4" />
            <line x1={x1} y1={y1} x2="150" y2="150" stroke="black" strokeWidth="2" />
            {!isNaN(theta2) ? (
                <line x1="150" y1="150" x2={x2} y2={y2} stroke="red" strokeWidth="2" />
            ) : (
                <line x1="150" y1="150" x2={300-x1} y2={y1} stroke="red" strokeWidth="2" strokeDasharray="2 2" />
            )}
         </svg>
      </div>
    </div>
  );
};
render(<SnellSim />);
`;

const SIR_CODE = `
const SIRSim = () => {
  const [beta, setBeta] = React.useState(0.3);
  const [gamma, setGamma] = React.useState(0.1);
  const [days, setDays] = React.useState(100);

  const data = React.useMemo(() => {
    let s = 999, i = 1, r = 0;
    const N = 1000;
    const d = [{ day: 0, s, i, r }];
    
    for(let t=1; t<=days; t++) {
      const dS = -beta * s * i / N;
      const dR = gamma * i;
      const dI = -dS - dR;
      s += dS;
      i += dI;
      r += dR;
      d.push({ day: t, s: Math.round(s), i: Math.round(i), r: Math.round(r) });
    }
    return d;
  }, [beta, gamma, days]);

  return (
    <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
       <div className="border-b border-[#E0E0E0] pb-4">
        <h2 className="text-xl font-bold uppercase tracking-tight mb-2">SIR Disease Model</h2>
        <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
            Simulates an epidemic using compartmental models. 
            Beta controls how infectious the disease is (infection rate), while Gamma controls how fast people recover (recovery rate). A higher Beta leads to a sharper infection peak.
        </p>
      </div>
       <div className="grid grid-cols-3 gap-4 border-b border-[#E0E0E0] pb-4">
         <div>
            <label>Infection Rate (Beta): {beta}</label>
            <input type="range" min="0.01" max="1" step="0.01" value={beta} onChange={e=>setBeta(Number(e.target.value))} className="w-full" />
         </div>
         <div>
            <label>Recovery Rate (Gamma): {gamma}</label>
            <input type="range" min="0.01" max="0.5" step="0.01" value={gamma} onChange={e=>setGamma(Number(e.target.value))} className="w-full" />
         </div>
       </div>
       <div className="flex-1 min-h-[300px]">
         <Recharts.ResponsiveContainer width="100%" height="100%">
           <Recharts.LineChart data={data}>
             <Recharts.CartesianGrid stroke="#eee" />
             <Recharts.XAxis dataKey="day" tick={{fontSize: 10}} />
             <Recharts.YAxis tick={{fontSize: 10}} />
             <Recharts.Tooltip />
             <Recharts.Legend />
             <Recharts.Line type="monotone" dataKey="s" stroke="#333" name="Susceptible" dot={false} strokeWidth={1} />
             <Recharts.Line type="monotone" dataKey="i" stroke="#ff0000" name="Infected" dot={false} strokeWidth={2} />
             <Recharts.Line type="monotone" dataKey="r" stroke="#999" name="Recovered" dot={false} strokeWidth={1} />
           </Recharts.LineChart>
         </Recharts.ResponsiveContainer>
       </div>
    </div>
  );
};
render(<SIRSim />);
`;

const PREDATOR_PREY_CODE = `
const LVSim = () => {
    const [alpha, setAlpha] = React.useState(0.1); 
    const [beta, setBeta] = React.useState(0.02); 
    const [gamma, setGamma] = React.useState(0.3); 
    const [delta, setDelta] = React.useState(0.01); 

    const data = React.useMemo(() => {
        const d = [];
        let prey = 40;
        let pred = 9;
        const dt = 0.5;
        
        for(let t=0; t<200; t++) {
            const dPrey = (alpha * prey - beta * prey * pred) * dt;
            const dPred = (delta * prey * pred - gamma * pred) * dt;
            prey += dPrey;
            pred += dPred;
            d.push({t, prey: Math.max(0, prey), pred: Math.max(0, pred)});
        }
        return d;
    }, [alpha, beta, gamma, delta]);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Lotka-Volterra (Predator-Prey)</h2>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Shows the cyclic population dynamics between biological species. 
                    Prey population grows (Alpha) but is eaten by Predators (Beta). Predators thrive when prey is abundant (Delta) but die off without food (Gamma).
                </p>
            </div>
            <div className="grid grid-cols-4 gap-2 border-b border-[#E0E0E0] pb-4">
                <div><label>Prey Birth: {alpha}</label><input className="w-full" type="range" min="0.01" max="0.5" step="0.01" value={alpha} onChange={e=>setAlpha(Number(e.target.value))}/></div>
                <div><label>Predation: {beta}</label><input className="w-full" type="range" min="0.001" max="0.1" step="0.001" value={beta} onChange={e=>setBeta(Number(e.target.value))}/></div>
                <div><label>Pred Death: {gamma}</label><input className="w-full" type="range" min="0.01" max="0.5" step="0.01" value={gamma} onChange={e=>setGamma(Number(e.target.value))}/></div>
                <div><label>Pred Repro: {delta}</label><input className="w-full" type="range" min="0.001" max="0.1" step="0.001" value={delta} onChange={e=>setDelta(Number(e.target.value))}/></div>
            </div>
            <div className="flex-1 min-h-[300px]">
                <Recharts.ResponsiveContainer width="100%" height="100%">
                    <Recharts.LineChart data={data}>
                        <Recharts.CartesianGrid strokeDasharray="3 3"/>
                        <Recharts.XAxis dataKey="t"/>
                        <Recharts.YAxis/>
                        <Recharts.Tooltip/>
                        <Recharts.Legend/>
                        <Recharts.Line type="monotone" dataKey="prey" stroke="#000" dot={false} strokeWidth={1.5} name="Prey"/>
                        <Recharts.Line type="monotone" dataKey="pred" stroke="#ff0000" dot={false} strokeWidth={1.5} name="Predator"/>
                    </Recharts.LineChart>
                </Recharts.ResponsiveContainer>
            </div>
        </div>
    );
};
render(<LVSim />);
`;

const LOGISTIC_CODE = `
const LogisticSim = () => {
    const [K, setK] = React.useState(100);
    const [P0, setP0] = React.useState(5);
    const [r, setR] = React.useState(0.2);

    const data = React.useMemo(() => {
        const d = [];
        for(let t=0; t<=50; t++) {
            const p = K / (1 + ((K - P0) / P0) * Math.exp(-r * t));
            d.push({ t, pop: Math.round(p) });
        }
        return d;
    }, [K, P0, r]);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Logistic Population Growth</h2>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Unlike exponential growth, real populations are limited by resources. 
                    'K' represents the Carrying Capacity (max population). The population grows rapidly (r) initially but slows down as it approaches K.
                </p>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b border-[#E0E0E0] pb-4">
                <div>
                    <label>Carrying Cap (K): {K}</label>
                    <input type="range" min="50" max="200" value={K} onChange={e=>setK(Number(e.target.value))} className="w-full"/>
                </div>
                 <div>
                    <label>Initial Pop (P0): {P0}</label>
                    <input type="range" min="1" max="50" value={P0} onChange={e=>setP0(Number(e.target.value))} className="w-full"/>
                </div>
                <div>
                    <label>Growth Rate (r): {r}</label>
                    <input type="range" min="0.1" max="1" step="0.1" value={r} onChange={e=>setR(Number(e.target.value))} className="w-full"/>
                </div>
            </div>
             <div className="flex-1 min-h-[300px]">
             <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.AreaChart data={data}>
                    <Recharts.CartesianGrid strokeDasharray="3 3" />
                    <Recharts.XAxis dataKey="t" />
                    <Recharts.YAxis />
                    <Recharts.Tooltip />
                    <Recharts.Area type="monotone" dataKey="pop" stroke="#000" fill="#eee" />
                    <Recharts.ReferenceLine y={K} stroke="red" strokeDasharray="3 3" />
                </Recharts.AreaChart>
             </Recharts.ResponsiveContainer>
        </div>
        </div>
    );
};
render(<LogisticSim />);
`;

const ENZYME_CODE = `
const EnzymeSim = () => {
  const [Vmax, setVmax] = React.useState(100);
  const [Km, setKm] = React.useState(20);

  const data = React.useMemo(() => {
    const d = [];
    for(let s=0; s<=200; s+=5) {
        d.push({ s, v: (Vmax * s) / (Km + s) });
    }
    return d;
  }, [Vmax, Km]);

  return (
    <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
      <div className="border-b border-[#E0E0E0] pb-4">
        <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Michaelis-Menten Kinetics</h2>
        <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
            Describes the rate of enzymatic reactions. 
            Vmax is the maximum possible reaction rate at saturation. Km is the substrate concentration at which the reaction rate is half of Vmax (a measure of affinity).
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 border-b border-[#E0E0E0] pb-4">
        <div><label>Vmax: {Vmax}</label><input className="w-full" type="range" min="50" max="200" value={Vmax} onChange={e=>setVmax(Number(e.target.value))}/></div>
        <div><label>Km: {Km}</label><input className="w-full" type="range" min="1" max="100" value={Km} onChange={e=>setKm(Number(e.target.value))}/></div>
      </div>
      <div className="flex-1 min-h-[300px]">
        <Recharts.ResponsiveContainer width="100%" height="100%">
            <Recharts.LineChart data={data}>
                <Recharts.CartesianGrid strokeDasharray="3 3" />
                <Recharts.XAxis dataKey="s" label={{value: '[S] Substrate Conc.', position: 'insideBottom', offset: -5, fontSize: 10}}/>
                <Recharts.YAxis label={{value: 'v (Reaction Rate)', angle: -90, position: 'insideLeft', fontSize: 10}}/>
                <Recharts.Tooltip />
                <Recharts.Line type="monotone" dataKey="v" stroke="#000" dot={false} strokeWidth={2}/>
                <Recharts.ReferenceLine y={Vmax/2} stroke="red" strokeDasharray="3 3" label={{value: 'Vmax/2', fontSize: 9, position: 'insideRight'}} />
                <Recharts.ReferenceLine x={Km} stroke="red" strokeDasharray="3 3" label={{value: 'Km', fontSize: 9, position: 'insideTop'}} />
            </Recharts.LineChart>
        </Recharts.ResponsiveContainer>
      </div>
    </div>
  );
};
render(<EnzymeSim />);
`;

const HARDY_WEINBERG_CODE = `
const HardySim = () => {
    const [p, setP] = React.useState(0.5);
    const q = 1 - p;
    
    const data = [
        { name: 'AA (Homo Dom)', val: p * p, fill: '#000' },
        { name: 'Aa (Hetero)', val: 2 * p * q, fill: '#666' },
        { name: 'aa (Homo Rec)', val: q * q, fill: '#ccc' }
    ];

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Hardy-Weinberg Principle</h2>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Predicts genotype frequencies in a non-evolving population. 
                    If 'p' is the frequency of the dominant allele and 'q' is the recessive (1-p), the distribution of genotypes is p² (AA), 2pq (Aa), and q² (aa).
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <label className="block mb-2">Allele Frequency p (Dominant): {p.toFixed(2)}</label>
                <input className="w-full" type="range" min="0" max="1" step="0.01" value={p} onChange={e=>setP(Number(e.target.value))} />
                <div className="flex justify-between mt-2 text-[#757575]">
                    <span>p = {p.toFixed(2)}</span>
                    <span>q = {q.toFixed(2)}</span>
                </div>
            </div>
            <div className="flex-1 min-h-[300px]">
                 <Recharts.ResponsiveContainer width="100%" height="100%">
                    <Recharts.BarChart data={data}>
                        <Recharts.CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <Recharts.XAxis dataKey="name" tick={{fontSize: 10}} />
                        <Recharts.YAxis domain={[0, 1]} tick={{fontSize: 10}} />
                        <Recharts.Tooltip />
                        <Recharts.Bar dataKey="val" />
                    </Recharts.BarChart>
                 </Recharts.ResponsiveContainer>
            </div>
        </div>
    );
};
render(<HardySim />);
`;

const RIEMANN_CODE = `
const RiemannSim = () => {
  const [n, setN] = React.useState(10);
  
  const data = React.useMemo(() => {
    const d = [];
    const width = 10 / n;
    for(let i=0; i<n; i++) {
        const x = i * width;
        const y = 0.1 * x * x; // f(x) = 0.1x^2
        d.push({ x: x.toFixed(1), y, width });
    }
    return d;
  }, [n]);

  const exactArea = (0.1 * Math.pow(10, 3)) / 3;
  const approxArea = data.reduce((acc, item) => acc + (item.y * item.width), 0);

  return (
    <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
        <div className="border-b border-[#E0E0E0] pb-4">
            <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Riemann Sums (Integration)</h2>
            <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                Approximates the area under a curve by dividing it into 'n' rectangular partitions. 
                As 'n' approaches infinity, the sum of these rectangles converges to the exact integral (area).
            </p>
        </div>
        <div className="border-b border-[#E0E0E0] pb-4">
            <label>Partitions (n): {n}</label>
            <input type="range" min="4" max="50" value={n} onChange={e=>setN(Number(e.target.value))} className="w-full mt-2" />
            <div className="flex justify-between mt-2 font-bold">
                <span>Approx Area: {approxArea.toFixed(2)}</span>
                <span className="text-[#757575]">Exact Area: {exactArea.toFixed(2)}</span>
            </div>
        </div>
        <div className="flex-1 min-h-[300px]">
            <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.BarChart data={data} barCategoryGap={1}>
                     <Recharts.CartesianGrid strokeDasharray="3 3" />
                     <Recharts.XAxis dataKey="x" tick={{fontSize: 10}} />
                     <Recharts.YAxis tick={{fontSize: 10}} />
                     <Recharts.Tooltip />
                     <Recharts.Bar dataKey="y" fill="#000" opacity={0.5} />
                </Recharts.BarChart>
            </Recharts.ResponsiveContainer>
        </div>
    </div>
  );
};
render(<RiemannSim />);
`;

const TAYLOR_CODE = `
const TaylorSim = () => {
  const [terms, setTerms] = React.useState(1);
  
  const factorial = (n) => n <= 1 ? 1 : n * factorial(n - 1);

  const data = React.useMemo(() => {
      const d = [];
      for(let x=-Math.PI*2; x<=Math.PI*2; x+=0.1) {
          let approx = 0;
          for(let n=0; n<terms; n++) {
             const term = (Math.pow(-1, n) * Math.pow(x, 2*n + 1)) / factorial(2*n + 1);
             approx += term;
          }
          d.push({ x: x.toFixed(2), sin: Math.sin(x), approx });
      }
      return d;
  }, [terms]);

  return (
    <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
        <div className="border-b border-[#E0E0E0] pb-4">
            <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Taylor Series Expansion</h2>
            <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                Approximates complex functions (like sine) using a polynomial sum. 
                Increasing the number of terms improves accuracy further away from the center point (x=0).
            </p>
        </div>
        <div className="border-b border-[#E0E0E0] pb-4">
            <label>Taylor Series Terms (n): {terms}</label>
            <input type="range" min="1" max="10" value={terms} onChange={e=>setTerms(Number(e.target.value))} className="w-full mt-2" />
            <p className="mt-2 text-[#757575]">Approximating sin(x) near x=0</p>
        </div>
        <div className="flex-1 min-h-[300px]">
            <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.LineChart data={data}>
                    <Recharts.CartesianGrid strokeDasharray="3 3" />
                    <Recharts.XAxis dataKey="x" />
                    <Recharts.YAxis domain={[-2, 2]} />
                    <Recharts.Tooltip />
                    <Recharts.Legend />
                    <Recharts.Line type="monotone" dataKey="sin" stroke="#ccc" strokeWidth={3} dot={false} name="Exact sin(x)" />
                    <Recharts.Line type="monotone" dataKey="approx" stroke="#000" strokeWidth={1.5} dot={false} name="Taylor Approx" />
                </Recharts.LineChart>
            </Recharts.ResponsiveContainer>
        </div>
    </div>
  );
};
render(<TaylorSim />);
`;

const VECTOR_CODE = `
const VectorSim = () => {
    const [mode, setMode] = React.useState('rotational');
    const gridSize = 10;
    const points = [];
    
    for(let x=-gridSize; x<=gridSize; x+=2) {
        for(let y=-gridSize; y<=gridSize; y+=2) {
            points.push({x, y});
        }
    }

    return (
        <div className="h-full w-full p-6 font-mono text-xs flex flex-col gap-6">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Vector Fields</h2>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Visualizes different 2D vector fields F(x,y). 
                    Rotational fields mimic vortices (like fluids), while Divergent fields mimic sources (like electric charges).
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <label>Field Type:</label>
                <div className="flex gap-2 mt-2">
                    {['rotational', 'divergent', 'hyperbolic'].map(m => (
                        <button key={m} onClick={()=>setMode(m)} className={\`px-3 py-1 uppercase border \${mode===m ? 'bg-black text-white' : 'bg-white hover:bg-[#F9F9F9]'}\`}>
                            {m}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#F9F9F9] overflow-hidden min-h-[300px]">
                <svg width="300" height="300" viewBox="-12 -12 24 24">
                    <line x1="-10" y1="0" x2="10" y2="0" stroke="#E0E0E0" strokeWidth="0.1" />
                    <line x1="0" y1="-10" x2="0" y2="10" stroke="#E0E0E0" strokeWidth="0.1" />
                    {points.map((p, i) => {
                        let vx = 0, vy = 0;
                        if(mode === 'rotational') { vx = -p.y; vy = p.x; }
                        if(mode === 'divergent') { vx = p.x; vy = p.y; }
                        if(mode === 'hyperbolic') { vx = p.x; vy = -p.y; }

                        const mag = Math.sqrt(vx*vx + vy*vy) || 1;
                        const scale = 0.8;
                        const dx = (vx/mag) * scale;
                        const dy = (vy/mag) * scale;
                        
                        return (
                            <g key={i} transform={\`translate(\${p.x}, \${-p.y})\`}>
                                <line x1="0" y1="0" x2={dx} y2={-dy} stroke="black" strokeWidth="0.2" />
                                <circle cx="0" cy="0" r="0.2" fill={mode==='divergent' ? 'red' : '#999'} />
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};
render(<VectorSim />);
`;

const FOURIER_CODE = `
const FourierSim = () => {
    const [f1, setF1] = React.useState(1);
    const [f2, setF2] = React.useState(3);
    const [a1, setA1] = React.useState(1);
    const [a2, setA2] = React.useState(0.5);

    const data = React.useMemo(() => {
        const d = [];
        for(let t=0; t<Math.PI*4; t+=0.1) {
            const y1 = a1 * Math.sin(f1 * t);
            const y2 = a2 * Math.sin(f2 * t);
            d.push({ t: t.toFixed(1), combined: y1 + y2, y1, y2 });
        }
        return d;
    }, [f1, f2, a1, a2]);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Signal Superposition (Fourier)</h2>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Demonstrates how complex waves are built from simple sine waves. 
                    Adding two sine waves with different frequencies and amplitudes creates constructive and destructive interference patterns.
                </p>
            </div>
            <div className="grid grid-cols-4 gap-2 border-b border-[#E0E0E0] pb-4">
                 <div><label>Freq 1: {f1}</label><input className="w-full" type="range" min="1" max="5" value={f1} onChange={e=>setF1(Number(e.target.value))}/></div>
                 <div><label>Amp 1: {a1}</label><input className="w-full" type="range" min="0" max="2" step="0.1" value={a1} onChange={e=>setA1(Number(e.target.value))}/></div>
                 <div><label>Freq 2: {f2}</label><input className="w-full" type="range" min="1" max="10" value={f2} onChange={e=>setF2(Number(e.target.value))}/></div>
                 <div><label>Amp 2: {a2}</label><input className="w-full" type="range" min="0" max="2" step="0.1" value={a2} onChange={e=>setA2(Number(e.target.value))}/></div>
            </div>
            <div className="flex-1 min-h-[300px]">
                <Recharts.ResponsiveContainer width="100%" height="100%">
                    <Recharts.LineChart data={data}>
                         <Recharts.CartesianGrid strokeDasharray="3 3"/>
                         <Recharts.XAxis dataKey="t"/>
                         <Recharts.YAxis/>
                         <Recharts.Tooltip/>
                         <Recharts.Line type="monotone" dataKey="combined" stroke="#000" strokeWidth={2} dot={false} />
                         <Recharts.Line type="monotone" dataKey="y1" stroke="#ccc" strokeWidth={1} dot={false} strokeDasharray="3 3"/>
                         <Recharts.Line type="monotone" dataKey="y2" stroke="#ccc" strokeWidth={1} dot={false} strokeDasharray="3 3"/>
                    </Recharts.LineChart>
                </Recharts.ResponsiveContainer>
            </div>
        </div>
    );
};
render(<FourierSim />);
`;

const FRACTAL_CODE = `
const FractalSim = () => {
    const canvasRef = React.useRef(null);
    const [angle, setAngle] = React.useState(30);
    const [depth, setDepth] = React.useState(8);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;

        const drawBranch = (x, y, len, ang, d) => {
            if (d === 0) return;
            
            const x2 = x + len * Math.sin(ang * Math.PI / 180);
            const y2 = y - len * Math.cos(ang * Math.PI / 180);
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            drawBranch(x2, y2, len * 0.75, ang + angle, d - 1);
            drawBranch(x2, y2, len * 0.75, ang - angle, d - 1);
        };

        drawBranch(width / 2, height - 20, 80, 0, depth);

    }, [angle, depth]);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Recursive Fractals (Binary Tree)</h2>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Generates complex self-similar structures using simple recursion. 
                    Each branch splits into two smaller branches. Increasing the depth exponentially increases the number of lines drawn.
                </p>
            </div>
            <div className="flex gap-8 border-b border-[#E0E0E0] pb-4">
                <div className="flex-1"><label>Branch Angle: {angle}°</label><input className="w-full" type="range" min="0" max="90" value={angle} onChange={e=>setAngle(Number(e.target.value))}/></div>
                <div className="flex-1"><label>Recursion Depth: {depth}</label><input className="w-full" type="range" min="1" max="12" value={depth} onChange={e=>setDepth(Number(e.target.value))}/></div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#F9F9F9] border border-[#E0E0E0] min-h-[300px]">
                <canvas ref={canvasRef} width="400" height="300" className="w-full h-full object-contain" />
            </div>
        </div>
    );
};
render(<FractalSim />);
`;

const UNIT_CIRCLE_CODE = `
const UnitSim = () => {
    const [theta, setTheta] = React.useState(45);
    const rad = theta * Math.PI / 180;
    const cx = 150, cy = 150, r = 100;
    const x = cx + r * Math.cos(rad);
    const y = cy - r * Math.sin(rad);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Trigonometric Unit Circle</h2>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Visualizes the definition of Sine and Cosine. 
                    For any angle theta, Cosine is the x-coordinate (Blue) and Sine is the y-coordinate (Red) on a circle of radius 1.
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                 <label>Angle (theta): {theta}°</label>
                 <input className="w-full mt-2" type="range" min="0" max="360" value={theta} onChange={e=>setTheta(Number(e.target.value))} />
                 <div className="flex gap-4 mt-2">
                    <span className="text-red-600">sin(t) = {Math.sin(rad).toFixed(3)}</span>
                    <span className="text-blue-600">cos(t) = {Math.cos(rad).toFixed(3)}</span>
                 </div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#F9F9F9] relative min-h-[300px]">
                <svg width="300" height="300" viewBox="0 0 300 300">
                    <circle cx="150" cy="150" r="100" fill="none" stroke="#ccc" />
                    <line x1="50" y1="150" x2="250" y2="150" stroke="#eee" />
                    <line x1="150" y1="50" x2="150" y2="250" stroke="#eee" />
                    <line x1="150" y1="150" x2={x} y2={y} stroke="black" strokeWidth="2" />
                    <line x1="150" y1="150" x2={x} y2="150" stroke="blue" strokeWidth="2" />
                    <line x1={x} y1="150" x2={x} y2={y} stroke="red" strokeWidth="2" />
                    <circle cx={x} cy={y} r="4" fill="black" />
                </svg>
            </div>
        </div>
    );
};
render(<UnitSim />);
`;

const BEZIER_CODE = `
const BezierSim = () => {
    const [t, setT] = React.useState(0.5);
    const p0 = {x: 20, y: 250};
    const p1 = {x: 20, y: 20};
    const p2 = {x: 280, y: 20};
    const p3 = {x: 280, y: 250};

    const bx = Math.pow(1-t,3)*p0.x + 3*Math.pow(1-t,2)*t*p1.x + 3*(1-t)*t*t*p2.x + t*t*t*p3.x;
    const by = Math.pow(1-t,3)*p0.y + 3*Math.pow(1-t,2)*t*p1.y + 3*(1-t)*t*t*p2.y + t*t*t*p3.y;

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
             <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Cubic Bezier Curve</h2>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Parametric curves used in computer graphics. 
                    The curve starts at P0 and ends at P3. P1 and P2 act as 'magnets' pulling the curve towards them. 't' represents the progression along the path (0 to 1).
                </p>
            </div>
             <div className="border-b border-[#E0E0E0] pb-4">
                <label>Parameter t: {t.toFixed(2)}</label>
                <input className="w-full mt-2" type="range" min="0" max="1" step="0.01" value={t} onChange={e=>setT(Number(e.target.value))} />
            </div>
            <div className="flex-1 bg-[#F9F9F9] flex items-center justify-center border border-[#E0E0E0] min-h-[300px]">
                <svg width="300" height="300" viewBox="0 0 300 300">
                    <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="#ccc" strokeDasharray="3 3"/>
                    <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} stroke="#ccc" strokeDasharray="3 3"/>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#ccc" strokeDasharray="3 3"/>
                    <path d={\`M \${p0.x} \${p0.y} C \${p1.x} \${p1.y}, \${p2.x} \${p2.y}, \${p3.x} \${p3.y}\`} fill="none" stroke="black" strokeWidth="2" />
                    <circle cx={p0.x} cy={p0.y} r="3" fill="#999" />
                    <circle cx={p3.x} cy={p3.y} r="3" fill="#999" />
                    <circle cx={p1.x} cy={p1.y} r="3" fill="#ccc" stroke="black" />
                    <circle cx={p2.x} cy={p2.y} r="3" fill="#ccc" stroke="black" />
                    <circle cx={bx} cy={by} r="5" fill="red" />
                </svg>
            </div>
        </div>
    );
};
render(<BezierSim />);
`;

const GOLDEN_CODE = `
const GoldenSim = () => {
    const [count, setCount] = React.useState(7);

    // Generate squares
    const rects = React.useMemo(() => {
        let x = 0, y = 0;
        let w = 10, h = 10;
        let direction = 0; // 0:right, 1:up, 2:left, 3:down
        const r = [];
        const phi = 1.618;
        
        for(let i=0; i<count; i++) {
            r.push({x, y, w, h, i});
            if(i === count - 1) break;

            const nextSide = w * phi;
            // Simplified placement logic for visual spiral
            // Ideally we'd calculate exact x,y, but for viz we can scale SVG viewbox
            // This simulation just draws concentric growing boxes for the effect
        }
        return r;
    }, [count]);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Golden Ratio (Phi)</h2>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    A visual approximation of the Golden Spiral. 
                    Each subsequent square's side length is scaled by the golden ratio (approx 1.618), creating a self-similar logarithmic spiral found often in nature.
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <label>Iterations: {count}</label>
                <input className="w-full mt-2" type="range" min="1" max="9" value={count} onChange={e=>setCount(Number(e.target.value))} />
            </div>
            <div className="flex-1 flex items-center justify-center bg-white min-h-[300px] overflow-hidden">
                 {/* 
                   Rendering a true dynamic golden spiral SVG is mathematically involved for arbitrary depth.
                   For stability, we render a static high-res one but mask/reveal parts based on slider.
                 */}
                <svg width="300" height="200" viewBox="0 0 300 200">
                    <g opacity={count >= 1 ? 1 : 0.1}><rect x="0" y="0" width="185.4" height="185.4" fill="none" stroke="black" /><text x="5" y="15" fontSize="8">1</text></g>
                    <g opacity={count >= 2 ? 1 : 0.1}><rect x="185.4" y="0" width="114.6" height="114.6" fill="none" stroke="black" /><text x="190" y="15" fontSize="8">2</text></g>
                    <g opacity={count >= 3 ? 1 : 0.1}><rect x="185.4" y="114.6" width="70.8" height="70.8" fill="none" stroke="black" /><text x="190" y="125" fontSize="8">3</text></g>
                    <g opacity={count >= 4 ? 1 : 0.1}><rect x="256.2" y="114.6" width="43.8" height="43.8" fill="none" stroke="black" /><text x="260" y="125" fontSize="8">4</text></g>
                    <g opacity={count >= 5 ? 1 : 0.1}><rect x="256.2" y="158.4" width="27" height="27" fill="none" stroke="black" /></g>
                    <g opacity={count >= 6 ? 1 : 0.1}><rect x="239.2" y="158.4" width="17" height="17" fill="none" stroke="black" /></g>
                    <g opacity={count >= 7 ? 1 : 0.1}><rect x="239.2" y="148" width="10.4" height="10.4" fill="none" stroke="black" /></g>

                    <path d="M 0 185.4 A 185.4 185.4 0 0 1 185.4 0" fill="none" stroke="red" opacity={count>=2?1:0}/>
                    <path d="M 185.4 0 A 114.6 114.6 0 0 1 300 114.6" fill="none" stroke="red" opacity={count>=3?1:0}/>
                    <path d="M 300 114.6 A 70.8 70.8 0 0 1 229.2 185.4" fill="none" stroke="red" opacity={count>=4?1:0}/>
                </svg>
            </div>
        </div>
    );
};
render(<GoldenSim />);
`;

const BUBBLE_CODE = `
const BubbleSim = () => {
  const [count, setCount] = React.useState(20);
  const [array, setArray] = React.useState([]);
  const [sorting, setSorting] = React.useState(false);
  const [currentIdx, setCurrentIdx] = React.useState(-1);
  const [speed, setSpeed] = React.useState(50);
  const speedRef = React.useRef(50);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
      speedRef.current = speed;
  }, [speed]);

  React.useEffect(() => {
    mountedRef.current = true;
    const arr = Array.from({length: count}, () => Math.floor(Math.random() * 100) + 10);
    setArray(arr);
    return () => { mountedRef.current = false; };
  }, [count]);

  const sort = async () => {
    if(sorting) return;
    setSorting(true);
    const arr = [...array];
    for(let i=0; i<arr.length; i++) {
        for(let j=0; j<arr.length-i-1; j++) {
            if(!mountedRef.current) return;
            setCurrentIdx(j);
            // Always delay to visualize comparisons, even if no swap
            await new Promise(r => setTimeout(r, speedRef.current));
            
            if(arr[j] > arr[j+1]) {
                const temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
                if(mountedRef.current) setArray([...arr]);
            }
        }
    }
    if(mountedRef.current) {
        setCurrentIdx(-1);
        setSorting(false);
    }
  };

  return (
    <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
        <div className="border-b border-[#E0E0E0] pb-4">
            <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Bubble Sort Algorithm</h2>
            <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                A simple sorting algorithm that repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. 
                Red bars indicate the current comparison pair.
            </p>
        </div>
        <div className="flex flex-col gap-4 mb-4 border-b border-[#E0E0E0] pb-4">
            <div className="flex justify-between items-center">
                 <div className="flex gap-4 items-center flex-1">
                    <div className="flex flex-col w-1/3">
                        <label>Elements: {count}</label>
                        <input type="range" min="10" max="50" value={count} disabled={sorting} onChange={e=>setCount(Number(e.target.value))} />
                    </div>
                     <div className="flex flex-col w-1/3">
                        <label>Delay: {speed}ms (Speed)</label>
                        <input type="range" min="10" max="500" step="10" value={speed} onChange={e=>setSpeed(Number(e.target.value))} />
                    </div>
                </div>
                <button onClick={sort} disabled={sorting} className="bg-black text-white px-4 py-2 uppercase hover:opacity-80 disabled:opacity-50">
                    {sorting ? 'Sorting...' : 'Start Sort'}
                </button>
            </div>
        </div>
        <div className="flex-1 flex items-end justify-center gap-[1px] min-h-[300px]">
            {array.map((val, idx) => (
                <div 
                    key={idx} 
                    style={{ height: val + '%' }} 
                    className={"flex-1 transition-all " + (idx === currentIdx || idx === currentIdx + 1 ? 'bg-red-500' : 'bg-black')}
                ></div>
            ))}
        </div>
    </div>
  );
};
render(<BubbleSim />);
`;

const BINARY_CODE = `
const BinarySim = () => {
    const [target, setTarget] = React.useState(42);
    const [low, setLow] = React.useState(0);
    const [high, setHigh] = React.useState(19);
    const [mid, setMid] = React.useState(-1);
    const [found, setFound] = React.useState(false);
    
    const arr = React.useMemo(() => [2, 5, 8, 12, 16, 23, 28, 34, 42, 45, 50, 55, 61, 67, 72, 78, 85, 91, 95, 99], []);

    const step = () => {
        if(low > high || found) return;
        const m = Math.floor((low + high) / 2);
        setMid(m);
        if(arr[m] === target) {
            setFound(true);
        } else if(arr[m] < target) {
            setLow(m + 1);
        } else {
            setHigh(m - 1);
        }
    };
    
    const reset = () => {
        setLow(0); setHigh(19); setMid(-1); setFound(false);
    };

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Binary Search</h2>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Efficiently finds a target value within a sorted array. 
                    It works by repeatedly dividing the search interval in half. The active search range is highlighted in white/grey.
                </p>
            </div>
            <div className="flex items-center gap-4 border-b border-[#E0E0E0] pb-4">
                <label>Target: {target}</label>
                <select value={target} onChange={e=>{ setTarget(Number(e.target.value)); reset(); }} className="border p-1">
                    {arr.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <button onClick={step} disabled={found || low > high} className="bg-black text-white px-4 py-1">STEP</button>
                <button onClick={reset} className="bg-[#eee] px-4 py-1">RESET</button>
            </div>
            <div className="flex-1 flex flex-wrap content-start gap-2 min-h-[300px]">
                {arr.map((val, i) => {
                    let bg = '#eee';
                    let color = 'black';
                    if (i === mid) bg = 'black', color = 'white';
                    if (i === mid && val === target) bg = '#4CAF50';
                    if (i < low || i > high) bg = 'white', color='#ccc';
                    
                    return (
                        <div key={i} className="w-10 h-10 flex items-center justify-center border border-[#E0E0E0]" style={{ backgroundColor: bg, color: color }}>
                            {val}
                        </div>
                    );
                })}
            </div>
            <div className="text-center p-2 bg-[#F9F9F9]">
                {found ? "TARGET FOUND" : low > high ? "TARGET NOT FOUND" : \`SEARCHING RANGE: [\${low}, \${high}]\`}
            </div>
        </div>
    );
};
render(<BinarySim />);
`;

const BFS_CODE = `
const BFSSim = () => {
    const [grid, setGrid] = React.useState(() => {
        const g = Array(64).fill(0);
        g[0] = 2; g[63] = 3; g[10] = 1; g[11] = 1; g[18] = 1; g[35] = 1; g[36] = 1;
        return g;
    });
    const mountedRef = React.useRef(true);
    
    React.useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const runBFS = async () => {
        const g = [...grid];
        const queue = [0];
        const visited = new Set([0]);
        const parent = {};
        
        while(queue.length > 0) {
            if(!mountedRef.current) return;
            const curr = queue.shift();
            if(curr === 63) break;
            
            const neighbors = [];
            if(curr >= 8) neighbors.push(curr - 8);
            if(curr < 56) neighbors.push(curr + 8);
            if(curr % 8 !== 0) neighbors.push(curr - 1);
            if(curr % 8 !== 7) neighbors.push(curr + 1);
            
            for(let n of neighbors) {
                if(!visited.has(n) && g[n] !== 1) {
                    visited.add(n);
                    parent[n] = curr;
                    queue.push(n);
                    if(g[n] !== 3) {
                         g[n] = 4;
                         if(mountedRef.current) setGrid([...g]);
                         await new Promise(r => setTimeout(r, 50));
                    }
                }
            }
        }
    };

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Breadth-First Search (Flood Fill)</h2>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    A graph traversal algorithm that explores all neighbor nodes at the present depth before moving to nodes at the next depth level. 
                    Visualized here as a 'flood' expanding from the Green start node to the Red end node, avoiding Grey walls.
                </p>
            </div>
            <div className="flex justify-center border-b border-[#E0E0E0] pb-4">
                <button onClick={runBFS} className="bg-black text-white px-6 py-2 uppercase">Run Simulation</button>
            </div>
            <div className="flex-1 flex flex-col items-center gap-4 min-h-[300px]">
                <div className="grid grid-cols-8 gap-1 p-1 bg-[#E0E0E0]">
                    {grid.map((cell, i) => {
                        let color = 'white';
                        if(cell === 1) color = '#333';
                        if(cell === 2) color = 'green';
                        if(cell === 3) color = 'red';
                        if(cell === 4) color = '#ADD8E6';
                        return <div key={i} className="w-8 h-8" style={{backgroundColor: color}} />
                    })}
                </div>
                <div className="text-[#757575] text-[10px]">Green: Start | Red: End | Grey: Wall | Blue: Visited</div>
            </div>
        </div>
    );
};
render(<BFSSim />);
`;

const HANOI_CODE = `
const HanoiSim = () => {
    const [towers, setTowers] = React.useState([[3, 2, 1], [], []]);

    const move = (from, to) => {
        if(towers[from].length === 0) return;
        // Deep copy towers to avoid mutation
        const nextTowers = towers.map(t => [...t]);
        const disk = nextTowers[from].pop();
        if(nextTowers[to].length === 0 || nextTowers[to][nextTowers[to].length-1] > disk) {
             nextTowers[to].push(disk);
             setTowers(nextTowers);
        }
    };

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Towers of Hanoi</h2>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    A mathematical puzzle. The objective is to move the entire stack to another rod, obeying the rules: 
                    1) Only one disk can be moved at a time. 2) No disk may be placed on top of a smaller disk.
                </p>
            </div>
            <div className="mb-4 border-b pb-4">
                <label>Disks: 3 (Fixed for Demo)</label>
                <div className="mt-2 text-[#757575]">Click buttons to move top disk</div>
            </div>
            <div className="flex-1 flex items-end justify-around border-b-4 border-black pb-0 min-h-[300px]">
                {[0, 1, 2].map(tIdx => (
                    <div key={tIdx} className="flex flex-col items-center justify-end w-1/3 h-full relative group">
                        <div className="absolute bottom-0 w-2 h-full bg-[#E0E0E0] -z-10 rounded-t-lg"></div>
                        {towers[tIdx].map(size => (
                            <div key={size} className="h-6 bg-black mb-1 text-white flex items-center justify-center rounded-sm" style={{width: \`\${size * 30}%\`}}>
                                {size}
                            </div>
                        ))}
                        <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-0">
                            {[0,1,2].filter(x=>x!==tIdx).map(target => (
                                <button key={target} onClick={() => move(tIdx, target)} className="bg-black text-white text-[9px] px-2 py-1">
                                    To {target+1}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-around mt-2 font-bold">
                <span>T1</span><span>T2</span><span>T3</span>
            </div>
        </div>
    );
};
render(<HanoiSim />);
`;

const PID_CODE = `
const PIDSim = () => {
  const [kp, setKp] = React.useState(0.5);
  const [ki, setKi] = React.useState(0.1);
  const [kd, setKd] = React.useState(0.1);
  const [setpoint, setSetpoint] = React.useState(50);

  const data = React.useMemo(() => {
    const d = [];
    let integral = 0;
    let lastError = 0;
    let output = 0;
    let processVar = 0;
    
    for(let t=0; t<100; t++) {
        const error = setpoint - processVar;
        integral += error;
        const derivative = error - lastError;
        output = kp*error + ki*integral + kd*derivative;
        
        processVar += output * 0.1;
        
        d.push({ t, pv: processVar, sp: setpoint });
        lastError = error;
    }
    return d;
  }, [kp, ki, kd, setpoint]);

  return (
     <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
        <div className="border-b border-[#E0E0E0] pb-4">
            <h2 className="text-xl font-bold uppercase tracking-tight mb-2">PID Control Loop</h2>
            <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                A control loop mechanism widely used in industrial control systems.
                It calculates an 'error' value (difference between desired Setpoint and Process Variable) and applies correction based on Proportional (Kp), Integral (Ki), and Derivative (Kd) terms.
            </p>
        </div>
        <div className="grid grid-cols-4 gap-4 border-b border-[#E0E0E0] pb-4">
            <div>
                 <label>Target (SP): {setpoint}</label>
                 <input type="range" min="0" max="100" value={setpoint} onChange={e=>setSetpoint(Number(e.target.value))} className="w-full"/>
            </div>
            <div>
                 <label>Kp: {kp}</label>
                 <input type="range" min="0" max="2" step="0.1" value={kp} onChange={e=>setKp(Number(e.target.value))} className="w-full"/>
            </div>
            <div>
                 <label>Ki: {ki}</label>
                 <input type="range" min="0" max="0.5" step="0.01" value={ki} onChange={e=>setKi(Number(e.target.value))} className="w-full"/>
            </div>
            <div>
                 <label>Kd: {kd}</label>
                 <input type="range" min="0" max="2" step="0.1" value={kd} onChange={e=>setKd(Number(e.target.value))} className="w-full"/>
            </div>
        </div>
        <div className="flex-1 min-h-[300px]">
            <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.LineChart data={data}>
                     <Recharts.CartesianGrid strokeDasharray="3 3" />
                     <Recharts.XAxis dataKey="t" />
                     <Recharts.YAxis domain={[0, 100]}/>
                     <Recharts.Tooltip />
                     <Recharts.Line type="monotone" dataKey="pv" stroke="#000" strokeWidth={2} dot={false} name="Process Variable" />
                     <Recharts.Line type="step" dataKey="sp" stroke="#999" strokeDasharray="5 5" dot={false} name="Setpoint" />
                </Recharts.LineChart>
            </Recharts.ResponsiveContainer>
        </div>
     </div>
  );
};
render(<PIDSim />);
`;

const LOGIC_CODE = `
const LogicSim = () => {
    const [a, setA] = React.useState(false);
    const [b, setB] = React.useState(false);
    const [gate, setGate] = React.useState('AND');
    
    let out = false;
    if(gate === 'AND') out = a && b;
    if(gate === 'OR') out = a || b;
    if(gate === 'XOR') out = a !== b;
    if(gate === 'NAND') out = !(a && b);

    return (
        <div className="h-full w-full p-8 flex flex-col items-center gap-8 font-mono text-xs">
            <div className="w-full border-b border-[#E0E0E0] pb-4 mb-4 text-center">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Digital Logic Gates</h2>
                <p className="text-sm text-[#555555] leading-relaxed">
                    Fundamental building blocks of digital circuits. 
                    AND (Both true), OR (One true), XOR (Different inputs), NAND (Not AND).
                </p>
            </div>
            
            <div className="flex gap-4">
                {['AND', 'OR', 'XOR', 'NAND'].map(g => (
                    <button key={g} onClick={()=>setGate(g)} className={\`px-4 py-2 border \${gate===g ? 'bg-black text-white' : 'bg-white'}\`}>{g}</button>
                ))}
            </div>
            
            <div className="flex items-center gap-8 text-lg min-h-[200px]">
                <div className="flex flex-col gap-4">
                    <button onClick={()=>setA(!a)} className={\`w-16 h-16 border flex items-center justify-center \${a ? 'bg-black text-white' : 'bg-white'}\`}>A={a?'1':'0'}</button>
                    <button onClick={()=>setB(!b)} className={\`w-16 h-16 border flex items-center justify-center \${b ? 'bg-black text-white' : 'bg-white'}\`}>B={b?'1':'0'}</button>
                </div>
                
                <div className="w-24 h-24 border border-black flex items-center justify-center text-2xl font-bold bg-[#F9F9F9]">
                    {gate}
                </div>
                
                <div className={\`w-16 h-16 border flex items-center justify-center font-bold transition-all \${out ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(0,255,0,0.5)]' : 'bg-[#eee] text-[#999]'}\`}>
                    {out?'1':'0'}
                </div>
            </div>
        </div>
    );
};
render(<LogicSim />);
`;

const FSM_CODE = `
const FSMSim = () => {
    const [state, setState] = React.useState('RED');
    
    React.useEffect(() => {
        let timer;
        if(state === 'RED') timer = setTimeout(() => setState('GREEN'), 3000);
        if(state === 'GREEN') timer = setTimeout(() => setState('YELLOW'), 3000);
        if(state === 'YELLOW') timer = setTimeout(() => setState('RED'), 1000);
        return () => clearTimeout(timer);
    }, [state]);

    return (
        <div className="h-full w-full p-6 flex flex-col items-center gap-8 font-mono">
             <div className="w-full border-b border-[#E0E0E0] pb-4 text-center">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Finite State Machine (FSM)</h2>
                <p className="text-sm text-[#555555] leading-relaxed">
                    A computation model that can be in exactly one of a finite number of states at any given time.
                    This traffic light moves sequentially: RED -> GREEN -> YELLOW -> RED based on a timer.
                </p>
            </div>
            <div className="bg-[#333] p-4 rounded-none flex flex-col gap-4 shadow-lg">
                <div className={\`w-16 h-16 rounded-full border-2 border-black transition-colors duration-300 \${state==='RED' ? 'bg-red-600 shadow-[0_0_20px_red]' : 'bg-[#550000]'}\`}></div>
                <div className={\`w-16 h-16 rounded-full border-2 border-black transition-colors duration-300 \${state==='YELLOW' ? 'bg-yellow-500 shadow-[0_0_20px_yellow]' : 'bg-[#555500]'}\`}></div>
                <div className={\`w-16 h-16 rounded-full border-2 border-black transition-colors duration-300 \${state==='GREEN' ? 'bg-green-500 shadow-[0_0_20px_green]' : 'bg-[#005500]'}\`}></div>
            </div>
            <div className="text-xl font-bold uppercase mt-4">Current State: {state}</div>
        </div>
    );
};
render(<FSMSim />);
`;

// --- NEW PHYSICS SIMS ---

const RELATIVITY_CODE = `
const RelativitySim = () => {
    const [v, setV] = React.useState(0.5); // % of c
    const [t, setT] = React.useState(0);
    const gamma = 1 / Math.sqrt(1 - v*v);
    
    React.useEffect(() => {
        const interval = setInterval(() => {
            setT(prev => prev + 1);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Special Relativity (Einstein, 1905)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: ON THE ELECTRODYNAMICS OF MOVING BODIES</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Time dilation. As an object moves closer to the speed of light (c), time slows down relative to a stationary observer.
                    Lorentz Factor (gamma): {gamma.toFixed(3)}.
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <label>Velocity (v): {(v*100).toFixed(0)}% c</label>
                <input type="range" min="0" max="99" value={v*100} onChange={e=>setV(e.target.value/100)} className="w-full mt-2"/>
            </div>
            <div className="flex-1 flex gap-8 justify-center items-center bg-[#F9F9F9]">
                <div className="text-center">
                    <div className="mb-2 font-bold">Stationary Clock</div>
                    <div className="w-24 h-24 rounded-full border-2 border-black relative flex items-center justify-center bg-white">
                        <div 
                            className="absolute w-1 h-10 bg-black top-2 origin-bottom" 
                            style={{transform: \`rotate(\${t * 6}deg)\`}}
                        ></div>
                    </div>
                </div>
                <div className="text-center">
                    <div className="mb-2 font-bold">Moving Clock</div>
                    <div className="w-24 h-24 rounded-full border-2 border-red-600 relative flex items-center justify-center bg-white">
                        <div 
                            className="absolute w-1 h-10 bg-red-600 top-2 origin-bottom" 
                            style={{transform: \`rotate(\${t * 6 * (1/gamma)}deg)\`}}
                        ></div>
                    </div>
                    <div className="mt-2 text-red-600">{gamma.toFixed(2)}x Slower</div>
                </div>
            </div>
        </div>
    );
};
render(<RelativitySim />);
`;

const NEWTON_CODE = `
const NewtonOrbit = () => {
    const [t, setT] = React.useState(0);
    const [ecc, setEcc] = React.useState(0.0);

    React.useEffect(() => {
        // Simple constant angle speed approx for viz
        const interval = setInterval(() => setT(prev => (prev + 0.02) % (2 * Math.PI)), 16);
        return () => clearInterval(interval);
    }, []);

    // Elliptical orbit approx:
    // a = semi-major axis, b = semi-minor axis
    const cx = 150, cy = 150;
    const a = 100;
    const b = a * Math.sqrt(1 - ecc * ecc);
    
    // Focus distance c = a*e. Sun is at one focus.
    const fDist = a * ecc;
    const sunX = cx - fDist;

    // Position
    const x = cx + a * Math.cos(t);
    const y = cy + b * Math.sin(t);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Universal Gravitation (Newton, 1687)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: PRINCIPIA MATHEMATICA</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Describes planetary motion. Planets follow elliptical orbits with the Star at one focus.
                    Eccentricity (e) determines how 'stretched' the orbit is. e=0 is a circle.
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <label>Eccentricity (e): {ecc.toFixed(2)}</label>
                <input className="w-full mt-2" type="range" min="0" max="0.8" step="0.01" value={ecc} onChange={e=>setEcc(Number(e.target.value))} />
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#F9F9F9] relative min-h-[300px]">
                <svg width="300" height="300" viewBox="0 0 300 300">
                    <ellipse cx={cx} cy={cy} rx={a} ry={b} fill="none" stroke="#ccc" strokeDasharray="3 3" />
                    {/* Sun at Focus */}
                    <circle cx={sunX} cy={cy} r="12" fill="#FFD700" stroke="black" />
                    {/* Planet */}
                    <line x1={sunX} y1={cy} x2={x} y2={y} stroke="#999" opacity="0.5"/>
                    <circle cx={x} cy={y} r="6" fill="black" />
                </svg>
            </div>
        </div>
    );
};
render(<NewtonOrbit />);
`;

const SCHRODINGER_CODE = `
const SchrodingerBox = () => {
    const [n, setN] = React.useState(1);
    
    const data = React.useMemo(() => {
        const d = [];
        const L = 100;
        for(let x=0; x<=L; x+=1) {
            // psi = sqrt(2/L) * sin(n * pi * x / L)
            const psi = Math.sqrt(2/L) * Math.sin((n * Math.PI * x) / L);
            // Probability = psi^2
            d.push({ x, prob: psi * psi, psi });
        }
        return d;
    }, [n]);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Wave Mechanics (Schrödinger, 1926)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: QUANTIZATION AS AN EIGENVALUE PROBLEM</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Visualizes a 'Particle in a Box'. The wavefunction (blue) describes the quantum state, while its square (black area) represents the probability density of finding the particle at position x.
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <label>Energy Level (n): {n}</label>
                <input type="range" min="1" max="5" step="1" value={n} onChange={e=>setN(Number(e.target.value))} className="w-full mt-2"/>
            </div>
            <div className="flex-1 min-h-[300px]">
                <Recharts.ResponsiveContainer width="100%" height="100%">
                    <Recharts.AreaChart data={data}>
                        <Recharts.CartesianGrid strokeDasharray="3 3" />
                        <Recharts.XAxis dataKey="x" label={{ value: 'Position (x)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                        <Recharts.YAxis hide />
                        <Recharts.Tooltip />
                        <Recharts.Area type="monotone" dataKey="prob" fill="#ccc" stroke="none" name="Probability Density (|ψ|²)" />
                        <Recharts.Area type="monotone" dataKey="psi" fill="none" stroke="blue" strokeWidth={2} name="Wavefunction (ψ)" />
                    </Recharts.AreaChart>
                </Recharts.ResponsiveContainer>
            </div>
        </div>
    );
};
render(<SchrodingerBox />);
`;

const HUBBLE_CODE = `
const HubbleExp = () => {
    const [time, setTime] = React.useState(0);
    const points = React.useMemo(() => {
        const pts = [];
        for(let i=0; i<20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 50 + 10; 
            pts.push({ angle, dist });
        }
        return pts;
    }, []);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Expanding Universe (Hubble, 1929)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: A RELATION BETWEEN DISTANCE AND RADIAL VELOCITY</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Demonstrates that galaxies further away move faster away from us. As time progresses, the fabric of space expands, carrying galaxies with it. The center represents our vantage point.
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <label>Time / Expansion: {(time).toFixed(1)}</label>
                <input type="range" min="0" max="5" step="0.1" value={time} onChange={e=>setTime(Number(e.target.value))} className="w-full mt-2"/>
            </div>
            <div className="flex-1 flex items-center justify-center bg-black min-h-[300px] overflow-hidden">
                <div className="relative w-[300px] h-[300px] border border-white/20 rounded-full">
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-500 -translate-x-1 -translate-y-1 rounded-full z-10"></div>
                    {points.map((p, i) => {
                        const r = p.dist * (1 + time);
                        const x = 150 + r * Math.cos(p.angle);
                        const y = 150 + r * Math.sin(p.angle);
                        return (
                            <div 
                                key={i} 
                                className="absolute w-1 h-1 bg-white rounded-full transition-all duration-300"
                                style={{ left: x, top: y, opacity: x > 300 || x < 0 || y > 300 || y < 0 ? 0 : 1 }}
                            ></div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
render(<HubbleExp />);
`;

const PLANCK_CODE = `
const PlanckRad = () => {
    const [T, setT] = React.useState(5000); // Kelvin

    const data = React.useMemo(() => {
        const d = [];
        // Planck's Law: B(lam, T) ~ (1/lam^5) * 1 / (exp(hc/lam k T) - 1)
        // Simplified consts for viz
        const c1 = 1e9; 
        const c2 = 1e4; 
        for(let lam=100; lam<=2000; lam+=50) {
            const val = (c1 / Math.pow(lam, 5)) * (1 / (Math.exp(c2 / (lam * T/1000)) - 1));
            d.push({ nm: lam, intensity: val });
        }
        return d;
    }, [T]);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Black-Body Radiation (Planck, 1900)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: ON THE LAW OF DISTRIBUTION OF ENERGY</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Introduced the concept of energy quanta (E=hv) to solve the ultraviolet catastrophe. 
                    As Temperature (T) increases, the peak wavelength shifts to the left (Wien's Displacement) and total intensity increases.
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <label>Temperature: {T}K</label>
                <input type="range" min="3000" max="10000" step="100" value={T} onChange={e=>setT(Number(e.target.value))} className="w-full mt-2"/>
            </div>
            <div className="flex-1 min-h-[300px]">
                <Recharts.ResponsiveContainer width="100%" height="100%">
                    <Recharts.AreaChart data={data}>
                        <Recharts.CartesianGrid strokeDasharray="3 3" />
                        <Recharts.XAxis dataKey="nm" label={{ value: 'Wavelength (nm)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                        <Recharts.YAxis hide />
                        <Recharts.Tooltip />
                        <Recharts.Area type="monotone" dataKey="intensity" stroke="black" fill="#333" />
                    </Recharts.AreaChart>
                </Recharts.ResponsiveContainer>
            </div>
        </div>
    );
};
render(<PlanckRad />);
`;

const MAXWELL_CODE = `
const MaxwellWave = () => {
    const [t, setT] = React.useState(0);
    const [freq, setFreq] = React.useState(1.0);
    
    React.useEffect(() => {
        const i = setInterval(() => setT(p => p + 0.1), 30);
        return () => clearInterval(i);
    }, []);

    const points = [];
    for(let x=0; x<25; x+=0.5) {
        // E field in y, B field in z (visualized as isometric offset)
        const phase = x * freq - t;
        points.push({
            x: x * 12,
            ey: Math.sin(phase) * 40,
            bz: Math.sin(phase) * 40
        });
    }

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Electromagnetism (Maxwell, 1865)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: DYNAMICAL THEORY OF THE ELECTROMAGNETIC FIELD</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Visualizes an EM wave propagating through space. 
                    The Electric field (Blue, Vertical) and Magnetic field (Red, Horizontal) oscillate perpendicular to each other and the direction of propagation.
                </p>
            </div>
             <div className="border-b border-[#E0E0E0] pb-4">
                <label>Frequency (k): {freq.toFixed(1)}</label>
                <input className="w-full mt-2" type="range" min="0.5" max="3" step="0.1" value={freq} onChange={e=>setFreq(Number(e.target.value))} />
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#F9F9F9] min-h-[300px] overflow-hidden">
                <svg width="350" height="200" viewBox="0 0 350 200">
                    <line x1="0" y1="100" x2="350" y2="100" stroke="#ccc" strokeDasharray="3 3" />
                    {points.map((p, i) => (
                        <g key={i} transform={\`translate(\${p.x}, 100)\`}>
                            {/* E-Field (Vertical) */}
                            <line x1="0" y1="0" x2="0" y2={-p.ey} stroke="blue" opacity="0.3" />
                            <circle cx="0" cy={-p.ey} r="1" fill="blue" />
                            
                            {/* B-Field (Horizontal) */}
                            <line x1="0" y1="0" x2={p.bz * 0.5} y2={p.bz * 0.3} stroke="red" opacity="0.3" />
                            <circle cx={p.bz * 0.5} cy={p.bz * 0.3} r="1" fill="red" />
                        </g>
                    ))}
                    <polyline points={points.map(p => \`\${p.x},\${100 - p.ey}\`).join(' ')} fill="none" stroke="blue" strokeWidth="2" />
                    <polyline points={points.map(p => \`\${p.x + p.bz * 0.5},\${100 + p.bz * 0.3}\`).join(' ')} fill="none" stroke="red" strokeWidth="2" />
                </svg>
            </div>
        </div>
    );
};
render(<MaxwellWave />);
`;

// --- NEW CS SIMS ---

const TURING_CODE = `
const TuringSim = () => {
    const [tape, setTape] = React.useState([0, 1, 1, 0, 1, 0, 0, 0, 0, 0]);
    const [head, setHead] = React.useState(0);
    const [state, setState] = React.useState('A');
    const [running, setRunning] = React.useState(false);

    // Simple machine: Invert bits then move right
    const step = React.useCallback(() => {
        if (head >= tape.length) { setRunning(false); return; }
        
        const newTape = [...tape];
        const val = newTape[head];
        
        // Rule: Invert bit, move right
        newTape[head] = val === 0 ? 1 : 0;
        setTape(newTape);
        setHead(h => h + 1);
    }, [head, tape]);

    React.useEffect(() => {
        let i;
        if(running) i = setInterval(step, 500);
        return () => clearInterval(i);
    }, [running, step]);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Turing Machine (Turing, 1936)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: ON COMPUTABLE NUMBERS</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    The theoretical basis for all modern computers. A machine manipulates symbols on a strip of tape according to a table of rules.
                    This simple machine inverts bits (NOT gate) and moves right.
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <button onClick={() => setRunning(!running)} className="bg-black text-white px-4 py-2 uppercase">
                    {running ? 'Halt' : 'Run'}
                </button>
                <button onClick={() => {setHead(0); setTape([0, 1, 1, 0, 1, 0, 0, 0, 0, 0]); setRunning(false);}} className="ml-4 border border-[#ccc] px-4 py-2 uppercase">
                    Reset
                </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center bg-[#F9F9F9] gap-8">
                <div className="flex gap-1 border border-black p-2 bg-white">
                    {tape.map((bit, i) => (
                        <div key={i} className={\`w-10 h-10 border flex items-center justify-center text-lg font-bold \${i===head ? 'bg-black text-white' : 'bg-white'}\`}>
                            {bit}
                        </div>
                    ))}
                </div>
                <div className="text-center">
                    <div className="uppercase tracking-widest text-[#999]">Head Position: {head}</div>
                    <div className="uppercase tracking-widest text-[#999]">State: {state}</div>
                </div>
            </div>
        </div>
    );
};
render(<TuringSim />);
`;

const SHANNON_CODE = `
const ShannonSim = () => {
    const [p, setP] = React.useState(0.5);
    const entropy = -(p * Math.log2(p) + (1-p) * Math.log2(1-p));
    
    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
             <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Information Entropy (Shannon, 1948)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: A MATHEMATICAL THEORY OF COMMUNICATION</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Quantifies the amount of uncertainty or 'information' in a variable. 
                    For a coin flip, entropy is maximized (1 bit) when the coin is fair (p=0.5) and 0 when determined (p=0 or 1).
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <label>Probability (p): {p.toFixed(2)}</label>
                <input type="range" min="0.01" max="0.99" step="0.01" value={p} onChange={e=>setP(Number(e.target.value))} className="w-full mt-2"/>
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#F9F9F9] flex-col gap-4">
                <div className="text-4xl font-bold">{isNaN(entropy) ? 0 : entropy.toFixed(4)} Bits</div>
                <div className="w-64 h-32 flex items-end gap-1 border-b border-l border-black p-1">
                    {/* Simple bar chart of H(p) */}
                    {Array.from({length: 20}).map((_, i) => {
                        const x = (i+1)/21;
                        const h = -(x * Math.log2(x) + (1-x) * Math.log2(1-x));
                        return <div key={i} className={\`flex-1 bg-black \${Math.abs(x-p)<0.05 ? 'bg-red-500' : ''}\`} style={{height: \`\${h*100}%\`}}></div>
                    })}
                </div>
            </div>
        </div>
    );
};
render(<ShannonSim />);
`;

const DIJKSTRA_CODE = `
const DijkstraSim = () => {
    // Fixed graph of 5 nodes
    const nodes = [
        {id: 'A', x: 50, y: 150},
        {id: 'B', x: 150, y: 50},
        {id: 'C', x: 150, y: 250},
        {id: 'D', x: 250, y: 150},
        {id: 'E', x: 320, y: 150}
    ];
    // Adjacency for Dijkstra
    const adj = {
        A: [{n:'B', w:4}, {n:'C', w:2}],
        B: [{n:'C', w:1}, {n:'D', w:5}],
        C: [{n:'D', w:8}, {n:'E', w:10}],
        D: [{n:'E', w:2}, {n:'C', w:2}], // D->C is valid in directed, but let's assume this flow
        E: []
    };
    
    // Edges for Viz
    const edges = [
        {s: 0, e: 1, w: 4}, {s: 0, e: 2, w: 2},
        {s: 1, e: 2, w: 1}, {s: 1, e: 3, w: 5},
        {s: 2, e: 3, w: 8}, {s: 2, e: 4, w: 10},
        {s: 3, e: 4, w: 2}, {s: 3, e: 2, w: 2} 
    ];

    const [currentStep, setCurrentStep] = React.useState(0);
    const [logs, setLogs] = React.useState([]);

    // Precompute steps for demo simplicity
    const steps = [
        { visited: ['A'], dists: {A:0, B:4, C:2, D:Infinity, E:Infinity}, curr: 'A', msg: "Start at A. Neighbors B(4), C(2)." },
        { visited: ['A', 'C'], dists: {A:0, B:3, C:2, D:10, E:12}, curr: 'C', msg: "Visit C (min dist 2). Update B (2+1 < 4), D (2+8), E (2+10)." },
        { visited: ['A', 'C', 'B'], dists: {A:0, B:3, C:2, D:8, E:12}, curr: 'B', msg: "Visit B (min dist 3). Update D (3+5 = 8)." },
        { visited: ['A', 'C', 'B', 'D'], dists: {A:0, B:3, C:2, D:8, E:10}, curr: 'D', msg: "Visit D (min dist 8). Update E (8+2 = 10)." },
        { visited: ['A', 'C', 'B', 'D', 'E'], dists: {A:0, B:3, C:2, D:8, E:10}, curr: 'E', msg: "Visit E. All nodes visited." }
    ];

    const state = steps[currentStep];

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Shortest Path (Dijkstra, 1959)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: NOTE ON TWO PROBLEMS IN CONNEXION WITH GRAPHS</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Iteratively explores the closest unvisited neighbors to find the shortest path from the source.
                    Step through the algorithm to see how distance estimates update.
                </p>
            </div>
            
            <div className="border-b border-[#E0E0E0] pb-4 flex gap-4">
                <button 
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} 
                    disabled={currentStep===0}
                    className="border px-4 py-2 disabled:opacity-30 hover:bg-gray-100"
                >
                    PREV
                </button>
                <button 
                    onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                    disabled={currentStep===steps.length-1}
                    className="bg-black text-white px-4 py-2 disabled:opacity-30"
                >
                    NEXT STEP ({currentStep+1}/{steps.length})
                </button>
            </div>

            <div className="flex-1 flex gap-8">
                <div className="flex-1 bg-[#F9F9F9] relative border border-[#E0E0E0]">
                    <svg width="100%" height="100%" viewBox="0 0 400 300">
                        {edges.map((e, i) => (
                            <g key={i}>
                                <line x1={nodes[e.s].x} y1={nodes[e.s].y} x2={nodes[e.e].x} y2={nodes[e.e].y} stroke="#ccc" strokeWidth="2" />
                                <text x={(nodes[e.s].x+nodes[e.e].x)/2} y={(nodes[e.s].y+nodes[e.e].y)/2} fill="red" fontSize="10">{e.w}</text>
                            </g>
                        ))}
                        {nodes.map((n, i) => (
                            <g key={i}>
                                <circle 
                                    cx={n.x} cy={n.y} r="18" 
                                    fill={state.curr === n.id ? '#4CAF50' : state.visited.includes(n.id) ? 'black' : 'white'} 
                                    stroke="black" 
                                    strokeWidth={state.curr === n.id ? 2 : 1}
                                />
                                <text x={n.x} y={n.y+4} textAnchor="middle" fill={state.visited.includes(n.id) || state.curr === n.id ? 'white' : 'black'} fontSize="10" fontWeight="bold">{n.id}</text>
                                <text x={n.x} y={n.y-22} textAnchor="middle" fill="#333" fontSize="11" fontWeight="bold">{state.dists[n.id] === Infinity ? '∞' : state.dists[n.id]}</text>
                            </g>
                        ))}
                    </svg>
                </div>
                <div className="w-48 border-l border-[#E0E0E0] pl-6 flex flex-col gap-4">
                    <div className="font-bold border-b pb-2">STATUS</div>
                    <div className="p-2 bg-yellow-50 border border-yellow-100 text-[#555]">
                        {state.msg}
                    </div>
                    <div className="font-bold border-b pb-2 mt-4">DISTANCES</div>
                    {Object.entries(state.dists).map(([k,v]) => (
                        <div key={k} className="flex justify-between">
                            <span>Node {k}:</span>
                            <span className="font-bold">{v === Infinity ? 'INF' : v}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
render(<DijkstraSim />);
`;

const PAGERANK_CODE = `
const PageRankSim = () => {
    // 4 nodes
    const [ranks, setRanks] = React.useState([0.25, 0.25, 0.25, 0.25]);
    
    // Adjacency: 0->1, 0->2, 1->2, 2->0, 3->2 (Node 2 is popular)
    const iterate = () => {
        const newRanks = [0, 0, 0, 0];
        // Contributions
        // Node 0 splits to 1,2 (0.5 each)
        newRanks[1] += ranks[0] * 0.5;
        newRanks[2] += ranks[0] * 0.5;
        // Node 1 splits to 2 (1.0)
        newRanks[2] += ranks[1] * 1.0;
        // Node 2 splits to 0 (1.0)
        newRanks[0] += ranks[2] * 1.0;
        // Node 3 splits to 2 (1.0)
        newRanks[2] += ranks[3] * 1.0;
        
        // Damping factor 0.85
        const d = 0.85;
        const finalRanks = newRanks.map(r => (1-d)/4 + d * r);
        setRanks(finalRanks);
    };

    const reset = () => setRanks([0.25, 0.25, 0.25, 0.25]);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">PageRank (Brin & Page, 1998)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: ANATOMY OF A WEB SEARCH ENGINE</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    The algorithm that powered Google. A page is "important" if other important pages link to it. 
                    Node 2 receives links from 0, 1, and 3, making it the authority.
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <button onClick={iterate} className="bg-black text-white px-4 py-2 uppercase mr-4">Iterate</button>
                <button onClick={reset} className="border border-[#ccc] px-4 py-2 uppercase">Reset</button>
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#F9F9F9] relative min-h-[300px]">
                <svg width="400" height="300" viewBox="0 0 400 300">
                    {/* Links */}
                    <path d="M 100 50 L 100 250" stroke="#ccc" markerEnd="url(#arrow)"/>
                    <path d="M 100 50 L 300 150" stroke="#ccc" markerEnd="url(#arrow)"/>
                    <path d="M 100 250 L 300 150" stroke="#ccc" markerEnd="url(#arrow)"/>
                    <path d="M 300 150 L 100 50" stroke="#ccc" strokeDasharray="3 3"/>
                    <path d="M 300 50 L 300 150" stroke="#ccc" markerEnd="url(#arrow)"/>
                    
                    <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="25" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L9,3 z" fill="#999" />
                        </marker>
                    </defs>

                    {/* Nodes */}
                    <circle cx="100" cy="50" r={20 + ranks[0]*50} fill="white" stroke="black" />
                    <text x="100" y="54" textAnchor="middle">0 ({ranks[0].toFixed(2)})</text>

                    <circle cx="100" cy="250" r={20 + ranks[1]*50} fill="white" stroke="black" />
                    <text x="100" y="254" textAnchor="middle">1 ({ranks[1].toFixed(2)})</text>

                    <circle cx="300" cy="150" r={20 + ranks[2]*50} fill="black" stroke="black" />
                    <text x="300" y="154" textAnchor="middle" fill="white">2 ({ranks[2].toFixed(2)})</text>

                    <circle cx="300" cy="50" r={20 + ranks[3]*50} fill="white" stroke="black" />
                    <text x="300" y="54" textAnchor="middle">3 ({ranks[3].toFixed(2)})</text>
                </svg>
            </div>
        </div>
    );
};
render(<PageRankSim />);
`;

const RSA_CODE = `
const RSASim = () => {
    // Simple primes
    const p = 11;
    const q = 3;
    const n = p * q; // 33
    const phi = (p-1)*(q-1); // 20
    const e = 3; // coprime to 20
    const d = 7; // (3*7 = 21 = 1 mod 20)
    
    const [msg, setMsg] = React.useState(5);
    const encrypted = Math.pow(msg, e) % n;
    const decrypted = Math.pow(encrypted, d) % n;

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Public Key Crypto (RSA, 1978)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: A METHOD FOR OBTAINING DIGITAL SIGNATURES</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Uses modular arithmetic to encrypt data. Security relies on the difficulty of factoring the large number 'n' (product of primes p and q) back into components.
                </p>
            </div>
            <div className="grid grid-cols-2 gap-8 border-b border-[#E0E0E0] pb-4">
                <div>
                    <h3 className="font-bold mb-2">KEYS</h3>
                    <div className="space-y-1 text-[#555]">
                        <div>p={p}, q={q}</div>
                        <div>n = p*q = <span className="text-black font-bold">{n}</span></div>
                        <div>Public Key (e, n) = ({e}, {n})</div>
                        <div>Private Key (d, n) = ({d}, {n})</div>
                    </div>
                </div>
                <div>
                    <label>Message (Number &lt; 33): {msg}</label>
                    <input type="range" min="1" max="32" value={msg} onChange={e=>setMsg(Number(e.target.value))} className="w-full mt-2"/>
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-4 bg-[#F9F9F9] p-8">
                <div className="flex items-center justify-between">
                    <div className="p-4 border bg-white">Message: {msg}</div>
                    <div className="h-px bg-black flex-1 mx-4 relative"><div className="absolute -top-3 left-1/2 text-[9px] bg-[#F9F9F9] px-1">M^e mod n</div></div>
                    <div className="p-4 border bg-black text-white">Encrypted: {encrypted}</div>
                    <div className="h-px bg-black flex-1 mx-4 relative"><div className="absolute -top-3 left-1/2 text-[9px] bg-[#F9F9F9] px-1">C^d mod n</div></div>
                    <div className="p-4 border bg-white border-green-500 text-green-700">Decrypted: {decrypted}</div>
                </div>
            </div>
        </div>
    );
};
render(<RSASim />);
`;

const BITCOIN_CODE = `
const BitcoinSim = () => {
    const [blocks, setBlocks] = React.useState([{id: 0, hash: '0000abc', prev: '0000000', nonce: 123}]);
    
    const mine = () => {
        const prevBlock = blocks[blocks.length-1];
        const newId = prevBlock.id + 1;
        const nonce = Math.floor(Math.random() * 9999);
        const hash = '0000' + Math.random().toString(16).substr(2, 4);
        setBlocks([...blocks, {id: newId, hash, prev: prevBlock.hash, nonce}]);
    };

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Blockchain (Nakamoto, 2008)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: BITCOIN: A PEER-TO-PEER ELECTRONIC CASH SYSTEM</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    A distributed ledger. Each block contains a cryptographic hash of the previous block, timestamp, and transaction data. 
                    This creates a chain where altering any record invalidates all subsequent blocks.
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <button onClick={mine} className="bg-black text-white px-4 py-2 uppercase">Mine Block</button>
            </div>
            <div className="flex-1 overflow-x-auto flex items-center gap-4 bg-[#F9F9F9] p-4">
                {blocks.map((b, i) => (
                    <div key={b.id} className="shrink-0 flex items-center">
                        <div className="w-32 bg-white border border-black p-2 flex flex-col gap-1 shadow-sm">
                            <div className="bg-black text-white text-center font-bold">BLOCK {b.id}</div>
                            <div className="text-[9px] text-gray-500">PREV: {b.prev.substr(0,6)}...</div>
                            <div className="text-[9px]">NONCE: {b.nonce}</div>
                            <div className="text-[9px] font-bold text-green-700">HASH: {b.hash}</div>
                        </div>
                        {i < blocks.length - 1 && <div className="w-8 h-px bg-black"></div>}
                    </div>
                ))}
            </div>
        </div>
    );
};
render(<BitcoinSim />);
`;

const PERCEPTRON_CODE = `
const PerceptronSim = () => {
    const [w1, setW1] = React.useState(0.5);
    const [w2, setW2] = React.useState(0.5);
    const [bias, setBias] = React.useState(-0.8);
    
    // Logic Gate AND visualization
    // Inputs (0,0), (0,1), (1,0), (1,1)
    const points = [
        {x:0, y:0, target: 0},
        {x:0, y:1, target: 0},
        {x:1, y:0, target: 0},
        {x:1, y:1, target: 1}
    ];

    const activate = (x, y) => (x * w1 + y * w2 + bias) > 0 ? 1 : 0;

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">The Perceptron (Rosenblatt, 1958)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: THE PERCEPTRON: A PROBABILISTIC MODEL</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    The ancestor of modern neural networks. It computes a weighted sum of inputs plus a bias. 
                    If the result > 0, it fires. Adjust weights to separate the black dot (1,1) from the white dots.
                </p>
            </div>
            <div className="flex gap-4 border-b border-[#E0E0E0] pb-4">
                <div className="flex-1"><label>Weight 1: {w1}</label><input className="w-full" type="range" min="-1" max="1" step="0.1" value={w1} onChange={e=>setW1(Number(e.target.value))}/></div>
                <div className="flex-1"><label>Weight 2: {w2}</label><input className="w-full" type="range" min="-1" max="1" step="0.1" value={w2} onChange={e=>setW2(Number(e.target.value))}/></div>
                <div className="flex-1"><label>Bias: {bias}</label><input className="w-full" type="range" min="-2" max="0" step="0.1" value={bias} onChange={e=>setBias(Number(e.target.value))}/></div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#F9F9F9]">
                <div className="relative w-[200px] h-[200px] border border-black bg-white">
                    {/* Decision Boundary: w1*x + w2*y + b = 0 => y = (-w1*x - b) / w2 */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible">
                        <line 
                            x1="0" y1={200 - ((-w1*0 - bias)/w2 * 200)} 
                            x2="200" y2={200 - ((-w1*1 - bias)/w2 * 200)} 
                            stroke="red" strokeWidth="2" strokeDasharray="4 4"
                        />
                    </svg>
                    {points.map((p, i) => {
                        const out = activate(p.x, p.y);
                        const correct = out === p.target;
                        return (
                            <div 
                                key={i} 
                                className={\`absolute w-4 h-4 rounded-full border border-black flex items-center justify-center text-[8px] \${p.target===1 ? 'bg-black text-white' : 'bg-white text-black'}\`}
                                style={{ 
                                    left: p.x * 180 + 10, 
                                    bottom: p.y * 180 + 10,
                                    boxShadow: correct ? '0 0 0 2px #4CAF50' : '0 0 0 2px #F44336'
                                }}
                            >
                                {out}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
render(<PerceptronSim />);
`;

// --- NEW BIO SIMS ---

const MENDEL_CODE = `
const MendelSim = () => {
    const [p1, setP1] = React.useState('Pp');
    const [p2, setP2] = React.useState('Pp');

    // Helper to get traits
    const getTraits = (genotype) => {
        // Assume P is purple, p is white. Dominant P.
        return genotype.includes('P') ? 'Purple' : 'White';
    };

    const alleles1 = p1.split('');
    const alleles2 = p2.split('');
    const offspring = [
        alleles1[0] + alleles2[0],
        alleles1[0] + alleles2[1],
        alleles1[1] + alleles2[0],
        alleles1[1] + alleles2[1]
    ].map(s => {
        // Normalize Pp vs pP to Pp
        return (s === 'pP') ? 'Pp' : s;
    });

    const purpleCount = offspring.filter(g => g.includes('P')).length;
    const whiteCount = 4 - purpleCount;

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Mendelian Inheritance (Mendel, 1866)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: EXPERIMENTS ON PLANT HYBRIDIZATION</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Interactive Punnett Square. Select parent genotypes to see the statistical distribution of offspring traits.
                    (P = Dominant Purple, p = Recessive White).
                </p>
            </div>
            
            <div className="flex gap-8 border-b border-[#E0E0E0] pb-4">
                 <div className="flex flex-col gap-1">
                    <label>Parent 1:</label>
                    <div className="flex gap-2">
                        {['PP', 'Pp', 'pp'].map(g => (
                            <button key={g} onClick={()=>setP1(g)} className={\`border px-3 py-1 \${p1===g ? 'bg-black text-white' : 'bg-white'}\`}>{g}</button>
                        ))}
                    </div>
                 </div>
                 <div className="flex flex-col gap-1">
                    <label>Parent 2:</label>
                    <div className="flex gap-2">
                        {['PP', 'Pp', 'pp'].map(g => (
                            <button key={g} onClick={()=>setP2(g)} className={\`border px-3 py-1 \${p2===g ? 'bg-black text-white' : 'bg-white'}\`}>{g}</button>
                        ))}
                    </div>
                 </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center bg-[#F9F9F9] gap-4">
                <div className="grid grid-cols-[30px_100px_100px] gap-2">
                    <div></div>
                    <div className="text-center font-bold text-lg">{alleles1[0]}</div>
                    <div className="text-center font-bold text-lg">{alleles1[1]}</div>
                    
                    <div className="flex items-center justify-center font-bold text-lg">{alleles2[0]}</div>
                    <div className={\`h-24 flex flex-col items-center justify-center border border-black \${offspring[0].includes('P') ? 'bg-purple-500 text-white' : 'bg-white text-black'}\`}>
                        <span className="font-bold">{offspring[0]}</span>
                        <span className="text-[9px] uppercase">{getTraits(offspring[0])}</span>
                    </div>
                    <div className={\`h-24 flex flex-col items-center justify-center border border-black \${offspring[1].includes('P') ? 'bg-purple-500 text-white' : 'bg-white text-black'}\`}>
                        <span className="font-bold">{offspring[1]}</span>
                        <span className="text-[9px] uppercase">{getTraits(offspring[1])}</span>
                    </div>
                    
                    <div className="flex items-center justify-center font-bold text-lg">{alleles2[1]}</div>
                    <div className={\`h-24 flex flex-col items-center justify-center border border-black \${offspring[2].includes('P') ? 'bg-purple-500 text-white' : 'bg-white text-black'}\`}>
                         <span className="font-bold">{offspring[2]}</span>
                        <span className="text-[9px] uppercase">{getTraits(offspring[2])}</span>
                    </div>
                    <div className={\`h-24 flex flex-col items-center justify-center border border-black \${offspring[3].includes('P') ? 'bg-purple-500 text-white' : 'bg-white text-black'}\`}>
                         <span className="font-bold">{offspring[3]}</span>
                        <span className="text-[9px] uppercase">{getTraits(offspring[3])}</span>
                    </div>
                </div>
                <div className="text-[#757575] uppercase tracking-widest mt-4">
                    Ratio: {purpleCount/4*100}% Purple / {whiteCount/4*100}% White
                </div>
            </div>
        </div>
    );
};
render(<MendelSim />);
`;

const HODGKIN_CODE = `
const ActionPotentialSim = () => {
    const [t, setT] = React.useState(0);
    const [fired, setFired] = React.useState(false);

    const data = React.useMemo(() => {
        if(!fired) return Array(50).fill({v: -70});
        const d = [];
        for(let i=0; i<50; i++) {
            let v = -70;
            // Simplified AP curve
            if(i > 10 && i < 20) v = -70 + (i-10)*10; // Depol
            if(i >= 20 && i < 30) v = 30 - (i-20)*12; // Repol
            if(i >= 30) v = -90 + (i-30)*2; // Hyperpol return
            if(v > -70 && i > 40) v = -70; 
            d.push({t: i, v});
        }
        return d;
    }, [fired]);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Action Potential (Hodgkin-Huxley, 1952)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: QUANTITATIVE DESCRIPTION OF MEMBRANE CURRENT</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Models the electrical impulse in a neuron. 
                    Stimulation causes Na+ channels to open (Depolarization), followed by K+ channels opening (Repolarization), creating a voltage spike.
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <button onClick={()=>setFired(true)} className="bg-black text-white px-6 py-2 uppercase hover:bg-gray-800 transition-colors">
                    Stimulate Neuron
                </button>
                <button onClick={()=>setFired(false)} className="ml-4 border border-[#ccc] px-4 py-2 uppercase">Reset</button>
            </div>
            <div className="flex-1 min-h-[300px]">
                <Recharts.ResponsiveContainer width="100%" height="100%">
                    <Recharts.LineChart data={data}>
                        <Recharts.CartesianGrid strokeDasharray="3 3" />
                        <Recharts.XAxis dataKey="t" hide />
                        <Recharts.YAxis domain={[-100, 50]} label={{ value: 'Voltage (mV)', angle: -90, position: 'insideLeft' }} />
                        <Recharts.Tooltip />
                        <Recharts.Line type="monotone" dataKey="v" stroke="black" strokeWidth={2} dot={false} animationDuration={1000} />
                        <Recharts.ReferenceLine y={-55} stroke="red" strokeDasharray="3 3" label="Threshold" />
                    </Recharts.LineChart>
                </Recharts.ResponsiveContainer>
            </div>
        </div>
    );
};
render(<ActionPotentialSim />);
`;

const DARWIN_CODE = `
const DarwinSim = () => {
    const [bgDark, setBgDark] = React.useState(false);
    const [gen, setGen] = React.useState(0);
    const [pop, setPop] = React.useState({light: 50, dark: 50});

    const evolve = () => {
        // Selection pressure: if bg is dark, light dies faster
        let newLight = pop.light;
        let newDark = pop.dark;
        
        if (bgDark) {
            newLight *= 0.6; // Predated
            newDark *= 1.2;  // Thrives
        } else {
            newLight *= 1.2;
            newDark *= 0.6;
        }
        
        // Normalize to 100 max
        const total = newLight + newDark;
        const scale = 100 / total;
        setPop({ light: Math.round(newLight * scale), dark: Math.round(newDark * scale) });
        setGen(g => g + 1);
    };

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Natural Selection (Darwin, 1859)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: ON THE ORIGIN OF SPECIES</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Simulates industrial melanism (Peppered Moths). 
                    When the background is dark (soot), dark moths camouflage better and reproduce, while light moths are eaten. The population shifts over generations.
                </p>
            </div>
            <div className="flex items-center gap-8 border-b border-[#E0E0E0] pb-4">
                <button onClick={() => setBgDark(!bgDark)} className="border border-black px-4 py-2 uppercase">
                    Toggle Environment: {bgDark ? 'Dark (Soot)' : 'Light (Lichen)'}
                </button>
                <button onClick={evolve} className="bg-black text-white px-6 py-2 uppercase">
                    Evolve Generation ({gen})
                </button>
            </div>
            <div className={\`flex-1 flex flex-wrap content-start gap-1 p-4 transition-colors duration-500 \${bgDark ? 'bg-[#333]' : 'bg-[#E0E0E0]'}\`}>
                {Array.from({length: pop.light}).map((_, i) => <div key={'l'+i} className="w-3 h-3 bg-[#eee] rounded-full"></div>)}
                {Array.from({length: pop.dark}).map((_, i) => <div key={'d'+i} className="w-3 h-3 bg-[#111] rounded-full"></div>)}
            </div>
            <div className="flex justify-around font-bold">
                <span>Light Moths: {pop.light}%</span>
                <span>Dark Moths: {pop.dark}%</span>
            </div>
        </div>
    );
};
render(<DarwinSim />);
`;

const DNA_CODE = `
const DNASim = () => {
    const [speed, setSpeed] = React.useState(1);
    const [offset, setOffset] = React.useState(0);
    
    React.useEffect(() => {
        const i = setInterval(() => setOffset(p => p + speed * 0.1), 30);
        return () => clearInterval(i);
    }, [speed]);

    // Double helix projection
    const points = [];
    const seq = "AGCTTGACCGTA"; // Loop this sequence
    
    for(let t=0; t<4*Math.PI; t+=0.4) {
        const y = t*20;
        const phase = t + offset;
        const x1 = Math.sin(phase)*30;
        const x2 = Math.sin(phase + Math.PI)*30;
        
        // Z-index sim: if x1 is positive, it's in front? Simplified viz.
        const baseIdx = Math.floor(t) % seq.length;
        const base = seq[baseIdx];
        const pair = base === 'A' ? 'T' : base === 'T' ? 'A' : base === 'G' ? 'C' : 'G';
        
        points.push({y, x1, x2, base, pair, phase});
    }

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">DNA Structure (Watson & Crick, 1953)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: MOLECULAR STRUCTURE OF NUCLEIC ACIDS</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    The double helix. Two strands of nucleotides run in opposite directions, connected by base pairs (A-T, G-C).
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <label>Rotation Speed: {speed}</label>
                <input className="w-full mt-2" type="range" min="0" max="5" step="0.5" value={speed} onChange={e=>setSpeed(Number(e.target.value))} />
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#F9F9F9] py-8 overflow-hidden">
                <svg width="200" height="400" viewBox="-50 0 100 250">
                    {points.map((p, i) => (
                        <g key={i} transform={\`translate(0, \${p.y})\`}>
                            {/* Connector */}
                            <line x1={p.x1} y1="0" x2={p.x2} y2="0" stroke="#ccc" strokeWidth="1" />
                            
                            {/* Strand 1 */}
                            <circle cx={p.x1} cy="0" r="4" fill={Math.cos(p.phase) > 0 ? '#333' : '#999'} />
                            <text x={p.x1} y="3" textAnchor="middle" fontSize="6" fill="white">{p.base}</text>
                            
                            {/* Strand 2 */}
                            <circle cx={p.x2} cy="0" r="4" fill={Math.cos(p.phase + Math.PI) > 0 ? '#333' : '#999'} />
                            <text x={p.x2} y="3" textAnchor="middle" fontSize="6" fill="white">{p.pair}</text>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
};
render(<DNASim />);
`;

const CRISPR_CODE = `
const CrisprSim = () => {
    // Target DNA sequence
    const dna = "GGCACTGC";
    // Guide RNA
    const [rna, setRna] = React.useState("GGCA");
    const match = dna.includes(rna);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">CRISPR-Cas9 (Jinek et al., 2012)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: A PROGRAMMABLE DUAL-RNA-GUIDED DNA ENDONUCLEASE</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    A gene-editing tool derived from bacteria. 
                    The Cas9 protein uses a guide RNA sequence to find and cut a specific matching strand of DNA.
                </p>
            </div>
            
            <div className="border-b border-[#E0E0E0] pb-4">
                <label>Guide RNA Sequence: {rna}</label>
                <div className="flex gap-2 mt-2">
                    {['A','C','G','T'].map(base => (
                        <button key={base} onClick={()=>setRna(prev => (prev + base).slice(0,8))} className="border px-3 py-1 hover:bg-[#eee]">{base}</button>
                    ))}
                    <button onClick={()=>setRna('')} className="ml-4 text-red-600 uppercase">Clear</button>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center bg-[#F9F9F9] gap-8">
                {/* DNA STRAND */}
                <div className="flex gap-1">
                    <div className="mr-4 self-center font-bold">DNA:</div>
                    {dna.split('').map((base, i) => (
                        <div key={i} className="w-10 h-10 bg-white border border-[#ccc] flex items-center justify-center font-bold text-lg">
                            {base}
                        </div>
                    ))}
                </div>
                
                {/* RNA GUIDE */}
                <div className="flex gap-1">
                    <div className="mr-4 self-center font-bold text-blue-600">gRNA:</div>
                    {rna.split('').map((base, i) => (
                        <div key={i} className="w-10 h-10 bg-blue-100 border border-blue-300 flex items-center justify-center font-bold text-lg text-blue-800">
                            {base}
                        </div>
                    ))}
                </div>

                <div className={\`mt-4 px-6 py-2 uppercase font-bold text-white transition-colors \${match ? 'bg-green-600' : 'bg-red-500'}\`}>
                    {match ? 'Target Found - CUT INITIATED' : 'Searching...'}
                </div>
            </div>
        </div>
    );
};
render(<CrisprSim />);
`;

const CONWAY_CODE = `
const ConwaySim = () => {
    // 10x10 Grid
    const rows = 10;
    const cols = 10;
    const [grid, setGrid] = React.useState(() => {
        const g = Array(rows * cols).fill(0);
        // Glider
        g[1] = 1; g[12] = 1; g[20] = 1; g[21] = 1; g[22] = 1; 
        return g;
    });
    const [running, setRunning] = React.useState(false);

    React.useEffect(() => {
        if(!running) return;
        const i = setInterval(() => {
            setGrid(old => {
                const next = [...old];
                for(let r=0; r<rows; r++){
                    for(let c=0; c<cols; c++){
                        const idx = r*cols + c;
                        let neighbors = 0;
                        for(let i=-1; i<=1; i++) {
                            for(let j=-1; j<=1; j++) {
                                if(i===0 && j===0) continue;
                                const nr = r+i, nc = c+j;
                                if(nr>=0 && nr<rows && nc>=0 && nc<cols && old[nr*cols+nc]) neighbors++;
                            }
                        }
                        if(old[idx] === 1 && (neighbors < 2 || neighbors > 3)) next[idx] = 0;
                        if(old[idx] === 0 && neighbors === 3) next[idx] = 1;
                    }
                }
                return next;
            });
        }, 200);
        return () => clearInterval(i);
    }, [running]);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
            <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Game of Life (Conway, 1970)</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: MATHEMATICAL GAMES</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    A cellular automaton where complex patterns emerge from simple rules. 
                    Cells survive with 2 or 3 neighbors, and are born with exactly 3 neighbors.
                </p>
            </div>
            <div className="border-b border-[#E0E0E0] pb-4">
                <button onClick={() => setRunning(!running)} className="bg-black text-white px-4 py-2 uppercase mr-4">{running?'Stop':'Start'}</button>
                <button onClick={() => setGrid(Array(100).fill(0).map(()=>Math.random()>0.7?1:0))} className="border border-[#ccc] px-4 py-2 uppercase">Randomize</button>
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#eee]">
                <div className="grid grid-cols-10 gap-px bg-[#ccc] border border-[#ccc]">
                    {grid.map((cell, i) => (
                        <div 
                            key={i} 
                            onClick={() => {
                                const n = [...grid]; n[i] = n[i]?0:1; setGrid(n);
                            }}
                            className={\`w-8 h-8 cursor-pointer \${cell ? 'bg-black' : 'bg-white'}\`}
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );
};
render(<ConwaySim />);
`;

const ATTENTION_CODE = `
const AttentionSim = () => {
    const sentence = ["The", "animal", "didn't", "cross", "the", "street", "because", "it", "was", "too", "tired"];
    const [hoveredCell, setHoveredCell] = React.useState(null); // {q: index, k: index}

    // Deterministic "Multi-Head" Attention simulation
    const attentionMatrix = React.useMemo(() => {
        const n = sentence.length;
        const mat = Array(n).fill(0).map(() => Array(n).fill(0));
        
        // Fill with baseline (local attention)
        for(let i=0; i<n; i++) {
            for(let j=0; j<n; j++) {
                const dist = Math.abs(i-j);
                mat[i][j] = Math.max(0, 0.1 - dist * 0.02); // Local bias
            }
        }

        // Inject "Knowledge" (Specific strong associations)
        const addRel = (fromI, toI, strength) => {
            mat[fromI][toI] += strength;
        };

        // "it" (7) refers to "animal" (1)
        addRel(7, 1, 0.8); 
        // "tired" (10) refers to "animal" (1) or "it" (7)
        addRel(10, 1, 0.4);
        addRel(10, 7, 0.5);
        // "cross" (3) -> "street" (5)
        addRel(3, 5, 0.6);
        // "didn't" (2) -> "cross" (3)
        addRel(2, 3, 0.7);

        // Softmax normalization per row
        return mat.map(row => {
            const sum = row.reduce((a, b) => a + Math.exp(b), 0);
            return row.map(val => Math.exp(val) / sum);
        });
    }, []);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 font-mono text-xs">
             <div className="border-b border-[#E0E0E0] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Transformer Self-Attention</h2>
                <div className="text-[10px] bg-black text-white inline-block px-2 py-0.5 mb-2">PAPER: ATTENTION IS ALL YOU NEED (2017)</div>
                <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
                    Visualizes how the model computes context. The <strong>Query</strong> (Rows) looks at <strong>Keys</strong> (Columns) to gather information.
                    Darker cells indicate higher attention weights. Note how "it" attends strongly to "animal".
                </p>
            </div>
            
            <div className="flex-1 flex gap-8">
                {/* MATRIX VIEW */}
                <div className="flex flex-col">
                    <div className="flex mb-1">
                        <div className="w-20"></div> {/* Spacer */}
                        <div className="flex gap-1">
                            {sentence.map((word, k) => (
                                <div key={k} className="w-6 h-24 flex items-end justify-center pb-2">
                                    <span className={\`text-[9px] transition-colors duration-200 \${hoveredCell?.k === k ? 'font-bold text-black' : 'text-[#999]'}\`} style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                                        {word}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {sentence.map((qWord, q) => (
                        <div key={q} className="flex gap-1 mb-1 items-center">
                            <div className={\`w-20 text-right pr-2 text-[10px] \${hoveredCell?.q === q ? 'font-bold text-black' : 'text-[#777]'}\`}>
                                {qWord}
                            </div>
                            {attentionMatrix[q].map((weight, k) => (
                                <div 
                                    key={k}
                                    onMouseEnter={() => setHoveredCell({q, k})}
                                    onMouseLeave={() => setHoveredCell(null)}
                                    className={\`w-6 h-6 border transition-all duration-200 cursor-crosshair \${hoveredCell?.q === q && hoveredCell?.k === k ? 'border-red-500 z-10 scale-110' : 'border-transparent'}\`}
                                    style={{
                                        backgroundColor: 'rgba(0, 0, 0, ' + Math.pow(weight, 0.7) + ')' // Gamma correction for visibility
                                    }}
                                    title={\`\${sentence[q]} -> \${sentence[k]}: \${weight.toFixed(3)}\`}
                                ></div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* DETAILS PANEL */}
                <div className="flex-1 border-l border-[#E0E0E0] pl-8 flex flex-col justify-center">
                    {hoveredCell ? (
                        <div className="space-y-6">
                            <div>
                                <div className="text-[10px] uppercase text-[#999] tracking-widest mb-1">Query (Focus)</div>
                                <div className="text-2xl font-bold">{sentence[hoveredCell.q]}</div>
                            </div>
                            <div className="text-center text-[#ccc]">↓ attends to ↓</div>
                            <div>
                                <div className="text-[10px] uppercase text-[#999] tracking-widest mb-1">Key (Context)</div>
                                <div className="text-2xl font-bold">{sentence[hoveredCell.k]}</div>
                            </div>
                            <div className="pt-4 border-t border-[#E0E0E0]">
                                <div className="text-[10px] uppercase text-[#999] tracking-widest mb-1">Attention Weight</div>
                                <div className="text-4xl font-mono">{attentionMatrix[hoveredCell.q][hoveredCell.k].toFixed(4)}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-[#999] text-center italic">
                            Hover over the matrix<br/>to inspect attention scores.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
render(<AttentionSim />);
`;

// Helper to create base64 text for file data
const txtToBase64 = (str: string) => btoa(str);

export const LIBRARY_DATA: LibraryCategory[] = [
  {
    id: 'physics',
    label: 'Physics',
    subcategories: [
      {
        id: 'classical',
        label: 'Classical Mechanics',
        items: [
          {
            id: 'projectile',
            label: 'Projectile Motion',
            cachedCode: PROJECTILE_CODE,
            fileData: { name: 'projectile_motion.txt', type: 'text/plain', data: txtToBase64("Simulate projectile motion with velocity, angle, and gravity."), category: 'Physics' }
          },
          {
            id: 'newton_laws',
            label: 'Newton\'s Laws',
            cachedCode: NEWTON_LAWS_CODE,
            fileData: { name: 'newtons_laws.txt', type: 'text/plain', data: txtToBase64("Newton's Second Law F=ma simulation."), category: 'Physics' }
          },
          {
            id: 'shm',
            label: 'Simple Harmonic Motion',
            cachedCode: SHM_CODE,
            fileData: { name: 'shm_oscillator.txt', type: 'text/plain', data: txtToBase64("Visualizing Simple Harmonic Motion with Amplitude, Frequency, and Phase."), category: 'Physics' }
          }
        ]
      },
      {
        id: 'electromagnetism',
        label: 'Electromagnetism',
        items: [
           {
            id: 'ohm',
            label: 'Ohm\'s Law',
            cachedCode: OHM_CODE,
            fileData: { name: 'ohms_law.txt', type: 'text/plain', data: txtToBase64("Simulate V=IR circuit relationship."), category: 'Physics' }
          },
          {
            id: 'vector',
            label: 'Vector Fields',
            cachedCode: VECTOR_CODE,
            fileData: { name: 'vector_field.txt', type: 'text/plain', data: txtToBase64("Visualize 2D vector fields."), category: 'Physics' }
          }
        ]
      },
      {
        id: 'optics',
        label: 'Optics',
        items: [
          {
            id: 'snell',
            label: 'Snell\'s Law',
            cachedCode: SNELL_CODE,
            fileData: { name: 'snell_law.txt', type: 'text/plain', data: txtToBase64("Refraction of light through different media."), category: 'Physics' }
          }
        ]
      },
      {
         id: 'thermo',
         label: 'Thermodynamics',
         items: [
            {
                id: 'newton_cooling',
                label: 'Newton\'s Law of Cooling',
                cachedCode: NEWTON_COOLING_CODE,
                fileData: { name: 'cooling_law.txt', type: 'text/plain', data: txtToBase64("Exponential cooling of an object."), category: 'Physics' }
            }
         ]
      },
      {
          id: 'signals',
          label: 'Signals & Systems',
          items: [
              {
                  id: 'fourier',
                  label: 'Fourier Superposition',
                  cachedCode: FOURIER_CODE,
                  fileData: { name: 'fourier.txt', type: 'text/plain', data: txtToBase64("Superposition of sine waves."), category: 'Physics' }
              },
              {
                  id: 'pid',
                  label: 'PID Controller',
                  cachedCode: PID_CODE,
                  fileData: { name: 'pid_control.txt', type: 'text/plain', data: txtToBase64("Proportional-Integral-Derivative Control Loop."), category: 'Physics' }
              }
          ]
      }
    ]
  },
  {
      id: 'math',
      label: 'Mathematics',
      subcategories: [
          {
              id: 'calculus',
              label: 'Calculus',
              items: [
                  {
                      id: 'riemann',
                      label: 'Riemann Sums',
                      cachedCode: RIEMANN_CODE,
                      fileData: { name: 'riemann_sums.txt', type: 'text/plain', data: txtToBase64("Approximating integral area using rectangles."), category: 'Math' }
                  },
                  {
                      id: 'taylor',
                      label: 'Taylor Series',
                      cachedCode: TAYLOR_CODE,
                      fileData: { name: 'taylor_series.txt', type: 'text/plain', data: txtToBase64("Approximating functions with polynomial series."), category: 'Math' }
                  }
              ]
          },
          {
              id: 'geometry',
              label: 'Geometry',
              items: [
                  {
                      id: 'unit_circle',
                      label: 'Unit Circle',
                      cachedCode: UNIT_CIRCLE_CODE,
                      fileData: { name: 'unit_circle.txt', type: 'text/plain', data: txtToBase64("Trigonometric functions on a unit circle."), category: 'Math' }
                  },
                  {
                      id: 'bezier',
                      label: 'Bezier Curves',
                      cachedCode: BEZIER_CODE,
                      fileData: { name: 'bezier_curve.txt', type: 'text/plain', data: txtToBase64("Cubic Bezier curve construction."), category: 'Math' }
                  },
                  {
                      id: 'fractal',
                      label: 'Fractals',
                      cachedCode: FRACTAL_CODE,
                      fileData: { name: 'fractal_tree.txt', type: 'text/plain', data: txtToBase64("Recursive binary tree fractal."), category: 'Math' }
                  },
                  {
                      id: 'golden',
                      label: 'Golden Ratio',
                      cachedCode: GOLDEN_CODE,
                      fileData: { name: 'golden_ratio.txt', type: 'text/plain', data: txtToBase64("Golden spiral and rectangles."), category: 'Math' }
                  }
              ]
          }
      ]
  },
  {
      id: 'biology',
      label: 'Biology',
      subcategories: [
          {
              id: 'population',
              label: 'Population Dynamics',
              items: [
                  {
                      id: 'sir',
                      label: 'SIR Model',
                      cachedCode: SIR_CODE,
                      fileData: { name: 'sir_model.txt', type: 'text/plain', data: txtToBase64("Susceptible-Infected-Recovered epidemic model."), category: 'Biology' }
                  },
                  {
                      id: 'predator',
                      label: 'Predator-Prey',
                      cachedCode: PREDATOR_PREY_CODE,
                      fileData: { name: 'lotka_volterra.txt', type: 'text/plain', data: txtToBase64("Lotka-Volterra predator-prey dynamics."), category: 'Biology' }
                  },
                   {
                      id: 'logistic',
                      label: 'Logistic Growth',
                      cachedCode: LOGISTIC_CODE,
                      fileData: { name: 'logistic_growth.txt', type: 'text/plain', data: txtToBase64("Population growth with carrying capacity."), category: 'Biology' }
                  }
              ]
          },
          {
              id: 'biochem',
              label: 'Biochemistry',
              items: [
                  {
                      id: 'enzyme',
                      label: 'Enzyme Kinetics',
                      cachedCode: ENZYME_CODE,
                      fileData: { name: 'michaelis_menten.txt', type: 'text/plain', data: txtToBase64("Michaelis-Menten enzyme kinetics."), category: 'Biology' }
                  }
              ]
          },
          {
              id: 'genetics',
              label: 'Genetics',
              items: [
                   {
                      id: 'hardy',
                      label: 'Hardy-Weinberg',
                      cachedCode: HARDY_WEINBERG_CODE,
                      fileData: { name: 'hardy_weinberg.txt', type: 'text/plain', data: txtToBase64("Allele frequency equilibrium."), category: 'Biology' }
                  }
              ]
          }
      ]
  },
  {
      id: 'cs',
      label: 'Computer Science',
      subcategories: [
          {
              id: 'algorithms',
              label: 'Algorithms',
              items: [
                  {
                      id: 'bubble',
                      label: 'Bubble Sort',
                      cachedCode: BUBBLE_CODE,
                      fileData: { name: 'bubble_sort.txt', type: 'text/plain', data: txtToBase64("Bubble sort visualization."), category: 'CS' }
                  },
                   {
                      id: 'binary',
                      label: 'Binary Search',
                      cachedCode: BINARY_CODE,
                      fileData: { name: 'binary_search.txt', type: 'text/plain', data: txtToBase64("Binary search algorithm."), category: 'CS' }
                  },
                   {
                      id: 'bfs',
                      label: 'Breadth-First Search',
                      cachedCode: BFS_CODE,
                      fileData: { name: 'bfs_flood.txt', type: 'text/plain', data: txtToBase64("BFS flood fill algorithm."), category: 'CS' }
                  },
                   {
                      id: 'hanoi',
                      label: 'Towers of Hanoi',
                      cachedCode: HANOI_CODE,
                      fileData: { name: 'hanoi.txt', type: 'text/plain', data: txtToBase64("Recursive Towers of Hanoi solution."), category: 'CS' }
                  }
              ]
          },
          {
              id: 'logic',
              label: 'Digital Logic',
              items: [
                  {
                      id: 'logic_gates',
                      label: 'Logic Gates',
                      cachedCode: LOGIC_CODE,
                      fileData: { name: 'logic_gates.txt', type: 'text/plain', data: txtToBase64("Basic digital logic gates."), category: 'CS' }
                  },
                  {
                      id: 'fsm',
                      label: 'Finite State Machine',
                      cachedCode: FSM_CODE,
                      fileData: { name: 'fsm_traffic.txt', type: 'text/plain', data: txtToBase64("Traffic light FSM."), category: 'CS' }
                  }
              ]
          }
      ]
  },
  {
      id: 'papers',
      label: 'Seminal Papers',
      subcategories: [
          {
              id: 'paper-phys',
              label: 'Physics & Cosmology',
              items: [
                  { id: 'einstein', label: 'Special Relativity (Einstein)', cachedCode: RELATIVITY_CODE, fileData: { name: 'relativity_1905.txt', type: 'text/plain', data: txtToBase64("Special Relativity, Time Dilation, Speed of light limit.") }, url: 'https://www.fourmilab.ch/etexts/einstein/specrel/specrel.pdf' },
                  { id: 'newton', label: 'Principia (Newton)', cachedCode: NEWTON_CODE, fileData: { name: 'principia_1687.txt', type: 'text/plain', data: txtToBase64("Universal Gravitation, Orbits.") }, url: 'https://archive.org/details/principiamathema00newt' },
                  { id: 'schrodinger', label: 'Wave Mechanics (Schrödinger)', cachedCode: SCHRODINGER_CODE, fileData: { name: 'schrodinger_1926.txt', type: 'text/plain', data: txtToBase64("Wavefunction, Probability Density, Particle in a box.") }, url: 'https://people.math.harvard.edu/~knill/history/schrodinger/schrodinger_1926.pdf' },
                  { id: 'hubble', label: 'Expanding Universe (Hubble)', cachedCode: HUBBLE_CODE, fileData: { name: 'hubble_1929.txt', type: 'text/plain', data: txtToBase64("Cosmic Expansion, Redshift, Hubble Constant.") }, url: 'https://www.pnas.org/doi/pdf/10.1073/pnas.15.3.168' },
                  { id: 'planck', label: 'Blackbody Radiation (Planck)', cachedCode: PLANCK_CODE, fileData: { name: 'planck_1900.txt', type: 'text/plain', data: txtToBase64("Energy Quanta, Planck's Law.") }, url: 'https://web.ihep.su/dbserv/compas/src/planck01/eng.pdf' },
                  { id: 'maxwell', label: 'Electromagnetism (Maxwell)', cachedCode: MAXWELL_CODE, fileData: { name: 'maxwell_1865.txt', type: 'text/plain', data: txtToBase64("Electromagnetic Waves, Fields.") }, url: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/A_Dynamical_Theory_of_the_Electromagnetic_Field.pdf' }
              ]
          },
          {
              id: 'paper-cs',
              label: 'Computer Science',
              items: [
                  { id: 'turing', label: 'Turing Machine (Turing)', cachedCode: TURING_CODE, fileData: { name: 'turing_1936.txt', type: 'text/plain', data: txtToBase64("Computability, Turing Machine, Halting Problem.") }, url: 'https://www.cs.virginia.edu/~robins/Turing_Paper_1936.pdf' },
                  { id: 'shannon', label: 'Info Theory (Shannon)', cachedCode: SHANNON_CODE, fileData: { name: 'shannon_1948.txt', type: 'text/plain', data: txtToBase64("Mathematical Theory of Communication, Entropy, Bits.") }, url: 'https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf' },
                  { id: 'perceptron', label: 'Perceptron (Rosenblatt)', cachedCode: PERCEPTRON_CODE, fileData: { name: 'perceptron_1958.txt', type: 'text/plain', data: txtToBase64("Neural Networks, Linear Classifier.") }, url: 'https://blogs.umass.edu/brain-wars/files/2016/03/rosenblatt-1958.pdf' },
                  { id: 'dijkstra', label: 'Shortest Path (Dijkstra)', cachedCode: DIJKSTRA_CODE, fileData: { name: 'dijkstra_1959.txt', type: 'text/plain', data: txtToBase64("Graph Theory, Pathfinding.") }, url: 'https://www-m3.ma.tum.de/foswiki/pub/MN0506/WebHome/dijkstra.pdf' },
                  { id: 'rsa', label: 'Public Key Crypto (RSA)', cachedCode: RSA_CODE, fileData: { name: 'rsa_1978.txt', type: 'text/plain', data: txtToBase64("Cryptography, Prime Factorization.") }, url: 'https://people.csail.mit.edu/rivest/Rsapaper.pdf' },
                  { id: 'pagerank', label: 'PageRank (Brin/Page)', cachedCode: PAGERANK_CODE, fileData: { name: 'pagerank_1998.txt', type: 'text/plain', data: txtToBase64("Web Search, Graph Ranking.") }, url: 'http://infolab.stanford.edu/~backrub/google.html' },
                  { id: 'bitcoin', label: 'Bitcoin (Nakamoto)', cachedCode: BITCOIN_CODE, fileData: { name: 'bitcoin_2008.txt', type: 'text/plain', data: txtToBase64("Bitcoin P2P Cash System, Proof of Work, Blockchain.") }, url: 'https://bitcoin.org/bitcoin.pdf' },
                  { id: 'transformer', label: 'Transformers (Vaswani)', cachedCode: ATTENTION_CODE, fileData: { name: 'attention_2017.txt', type: 'text/plain', data: txtToBase64("Attention Is All You Need, Transformer Architecture, Self-Attention.") }, url: 'https://arxiv.org/pdf/1706.03762.pdf' }
              ]
          },
          {
              id: 'paper-bio',
              label: 'Biology',
              items: [
                  { id: 'darwin', label: 'Natural Selection (Darwin)', cachedCode: DARWIN_CODE, fileData: { name: 'origin_species_1859.txt', type: 'text/plain', data: txtToBase64("Evolution, Survival of the Fittest.") }, url: 'https://www.gutenberg.org/files/1228/1228-h/1228-h.htm' },
                  { id: 'mendel', label: 'Inheritance (Mendel)', cachedCode: MENDEL_CODE, fileData: { name: 'mendel_1866.txt', type: 'text/plain', data: txtToBase64("Genetics, Dominant/Recessive Traits.") }, url: 'http://www.mendelweb.org/Mendel.html' },
                  { id: 'hodgkin', label: 'Action Potential (Hodgkin)', cachedCode: HODGKIN_CODE, fileData: { name: 'neuron_1952.txt', type: 'text/plain', data: txtToBase64("Neuron firing, Voltage Gated Channels.") }, url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1392413/pdf/jphysiol01442-0106.pdf' },
                  { id: 'dna', label: 'DNA Structure (Watson/Crick)', cachedCode: DNA_CODE, fileData: { name: 'dna_1953.txt', type: 'text/plain', data: txtToBase64("Molecular Structure of Nucleic Acids, Double Helix.") }, url: 'https://www.nature.com/articles/171737a0.pdf' },
                  { id: 'conway', label: 'Game of Life (Conway)', cachedCode: CONWAY_CODE, fileData: { name: 'conway_1970.txt', type: 'text/plain', data: txtToBase64("Cellular Automata, Emergence.") }, url: 'https://web.stanford.edu/class/sts145/Library/life.pdf' },
                  { id: 'crispr', label: 'CRISPR (Jinek)', cachedCode: CRISPR_CODE, fileData: { name: 'crispr_2012.txt', type: 'text/plain', data: txtToBase64("Gene Editing, Cas9, Guide RNA.") }, url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3712628/' }
              ]
          }
      ]
  }
];

export const SAMPLE_FILES = [
  { label: 'Projectile Motion (Physics)', ...LIBRARY_DATA[0].subcategories[0].items[0].fileData },
  { label: 'SIR Disease Model (Bio)', ...LIBRARY_DATA[2].subcategories[0].items[0].fileData },
  { label: 'Bubble Sort (CS)', ...LIBRARY_DATA[3].subcategories[0].items[0].fileData },
  { label: 'Riemann Sums (Math)', ...LIBRARY_DATA[1].subcategories[0].items[0].fileData }
];