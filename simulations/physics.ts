import { Parameter, Params, num } from "./model";
export interface PhysicalState {
  t: number;
  x: number;
  y: number;
  speed: number;
  energy: number;
}
export interface PhysicsModel {
  title: string;
  description: string;
  assumptions: string;
  parameters: Parameter[];
  run: (p: Params) => PhysicalState[];
}
const sample = (
  duration: number,
  evaluate: (t: number) => Omit<PhysicalState, "t">,
): PhysicalState[] =>
  Array.from({ length: 121 }, (_, i) => {
    const t = (duration * i) / 120;
    return { t, ...evaluate(t) };
  });
export const physicsModels: Record<string, PhysicsModel> = {
  projectile: {
    title: "Projectile motion",
    description:
      "Launch, pause, and inspect the same trajectory. Horizontal velocity stays constant while gravity changes vertical velocity.",
    assumptions:
      "Point mass of 1 kg, constant gravity, no air resistance, launch and landing at y=0. Exact analytic solution; playback does not integrate the motion. Energy is kinetic plus gravitational potential.",
    parameters: [
      num("v", "Launch speed (m/s)", 30, 1, 60),
      num("angle", "Launch angle (°)", 45, 5, 90),
      num("g", "Gravity (m/s²)", 9.8, 1, 20, 0.1),
    ],
    run: (p) => {
      const v = Number(p.v),
        a = (Number(p.angle) * Math.PI) / 180,
        g = Number(p.g),
        vx = v * Math.cos(a),
        vy = v * Math.sin(a);
      return sample((2 * vy) / g, (t) => {
        const y = Math.max(0, vy * t - (g * t * t) / 2),
          speed = Math.hypot(vx, vy - g * t);
        return { x: vx * t, y, speed, energy: (speed * speed) / 2 + g * y };
      });
    },
  },
  newton: {
    title: "Newton’s second law",
    description:
      "A constant force produces constant acceleration. Compare position, speed, and kinetic energy at the same model time.",
    assumptions:
      "One-dimensional point mass, constant net force, initially at rest at x=0. No friction or artificial boundary wrapping. Position is in meters; energy is kinetic energy. Model duration is 8 seconds.",
    parameters: [
      num("force", "Net force (N)", 10, -30, 30),
      num("mass", "Mass (kg)", 5, 1, 20),
    ],
    run: (p) => {
      const m = Number(p.mass),
        a = Number(p.force) / m;
      return sample(8, (t) => ({
        x: (a * t * t) / 2,
        y: 0,
        speed: Math.abs(a * t),
        energy: (m * (a * t) ** 2) / 2,
      }));
    },
  },
  shm: {
    title: "Simple harmonic motion",
    description:
      "Observe how stiffness and mass affect the period while total mechanical energy stays constant.",
    assumptions:
      "Ideal undamped spring, x(0)=amplitude and v(0)=0. Exact x=A cos(√(k/m)t). Energy includes spring potential and kinetic energy; x is displacement from equilibrium.",
    parameters: [
      num("amplitude", "Amplitude (m)", 2, 0.5, 4, 0.5),
      num("k", "Stiffness (N/m)", 4, 1, 20),
      num("mass", "Mass (kg)", 2, 1, 10),
    ],
    run: (p) => {
      const A = Number(p.amplitude),
        k = Number(p.k),
        m = Number(p.mass),
        w = Math.sqrt(k / m);
      return sample((4 * Math.PI) / w, (t) => {
        const x = A * Math.cos(w * t),
          v = -A * w * Math.sin(w * t);
        return {
          x,
          y: 0,
          speed: Math.abs(v),
          energy: (m * v * v) / 2 + (k * x * x) / 2,
        };
      });
    },
  },
  orbit: {
    title: "Keplerian orbit",
    description:
      "The body moves faster near the focus and slower farther away. Equal time steps sweep equal areas.",
    assumptions:
      "Bound two-body orbit with fixed primary; normalized units a=1, GM=1 and test mass=1. Solve Kepler’s equation M=E−e sin(E) at equal time intervals. Energy is specific orbital energy.",
    parameters: [num("eccentricity", "Eccentricity", 0.5, 0, 0.8, 0.05)],
    run: (p) => {
      const e = Number(p.eccentricity);
      return sample(2 * Math.PI, (t) => {
        let E = t;
        for (let i = 0; i < 12; i++)
          E -= (E - e * Math.sin(E) - t) / (1 - e * Math.cos(E));
        const x = Math.cos(E) - e,
          y = Math.sqrt(1 - e * e) * Math.sin(E),
          r = Math.hypot(x, y),
          speed = Math.sqrt(2 / r - 1);
        return { x, y, speed, energy: (speed * speed) / 2 - 1 / r };
      });
    },
  },
};

/** RK4 on log populations keeps the positive Lotka–Volterra state positive. */
export function predatorPrey(
  alpha: number,
  beta: number,
  gamma: number,
  delta: number,
) {
  let u = Math.log(40),
    v = Math.log(9);
  const h = 0.01,
    out = [{ t: 0, prey: 40, pred: 9 }];
  const derivative = (x: number, y: number) => [
    alpha - beta * Math.exp(y),
    delta * Math.exp(x) - gamma,
  ];
  for (let step = 1; step <= 10000; step++) {
    const a = derivative(u, v),
      b = derivative(u + (h * a[0]) / 2, v + (h * a[1]) / 2),
      c = derivative(u + (h * b[0]) / 2, v + (h * b[1]) / 2),
      d = derivative(u + h * c[0], v + h * c[1]);
    u += (h * (a[0] + 2 * b[0] + 2 * c[0] + d[0])) / 6;
    v += (h * (a[1] + 2 * b[1] + 2 * c[1] + d[1])) / 6;
    if (step % 50 === 0)
      out.push({ t: step * h, prey: Math.exp(u), pred: Math.exp(v) });
  }
  return out;
}
