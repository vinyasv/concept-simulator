import { lessons } from "./simulations/lessons";

interface CachedConceptInput {
  id: string;
  title: string;
  subcategory: string;
  description: string;
}

/** Library code uses the same renderer as generated simulations, backed by tested native models. */
export const createCachedCSCode = ({ id, title }: CachedConceptInput) => {
  if (!lessons[id]) throw new Error(`Missing cached simulation model: ${id}`);
  return `render(<TraceSimulation id={${JSON.stringify(id)}} title={${JSON.stringify(title)}} />);`;
};
