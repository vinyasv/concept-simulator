import { GEMINI_MODEL_REASONING } from "../constants";
import { FileData, ChatMessage } from "../types";

// Backend API URL - uses environment variable or defaults to relative path for Vercel
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Calls the backend serverless function to generate content
 */
const callGeminiAPI = async (payload: {
    model: string;
    contents: any;
    config?: any;
}): Promise<{ text: string }> => {
    const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'API call failed' }));
        throw new Error(error.error || 'API call failed');
    }

    return response.json();
};

export const analyzeAndGenerateSimulation = async (
    base64Data: string,
    mimeType: string,
    onLog: (msg: string) => void
): Promise<string> => {
    onLog("Initializing System Core...");
    onLog(`Model Architecture: ${GEMINI_MODEL_REASONING}`);
    onLog("Allocating Thinking Budget: 16k tokens");

    const prompt = `
    You are an expert Physics Engine Developer and React Frontend Engineer.
    
    TASK:
    1. Analyze the provided image/document/text which describes a scientific concept, algorithm, mathematical formula, or system logic.
    2. Generate a ROBUST, SELF-CONTAINED React Functional Component called 'ConceptSimulation' that visualizes this concept.

    CRITICAL: YOU MUST USE THE PROVIDED 'SimSDK' COMPONENTS FOR THE LAYOUT.
    Global components are already available in scope. DO NOT IMPORT THEM.
    
    AVAILABLE COMPONENTS:
    1. <SimFrame title="Title" description="Desc" controls={...} stats={...}> ...children... </SimFrame>
       - The root wrapper.
       - 'controls': A React Fragment containing <Control> items.
       - 'stats': A React Fragment containing <Stat> items.
       - 'children': The main visualizer (SVG, Canvas, or Recharts).
    
    2. <Control label="Label" value={val}> <input ... /> </Control>
       - Use this for wrapping inputs/sliders.
    
    3. <Stat label="Label" value={val} unit="unit" highlight={boolean} />
       - Use this for displaying derived values (Output).

    AESTHETIC REQUIREMENTS ("Utilitarian Archival"):
    - Do not write your own layout classes for headers/sidebars. Use SimFrame.
    - VISUALIZATION: Use Recharts for data plotting. Use SVG for geometry/physics.
    - COLORS: Black, White, Greys. Use Red/Blue only for semantic meaning (e.g. force vectors, diffs).

    REQUIREMENTS:
    - The output must be valid, executable React code.
    - Use 'recharts' for charts.
    - Use 'tailwindcss' for styling inner SVG elements if needed.
    
    IMPORTS:
    - DO NOT include 'import React' or 'import ReactDOM'. Assume 'React' is globally available.
    - Use "import { IconName } from 'lucide-react';" for icons.
    - DO NOT import hooks separately. Use 'React.useState', 'React.useEffect'.
    
    CODE STRUCTURE EXAMPLE:
    
    const ConceptSimulation = () => {
       const [val, setVal] = React.useState(0);
       
       const controls = (
          <>
             <Control label="Input A" value={val}>
                <input type="range" ... />
             </Control>
             ...
          </>
       );
       
       const stats = (
          <>
             <Stat label="Output X" value={val * 2} unit="m/s" highlight />
          </>
       );
    
       return (
          <SimFrame 
             title="My Simulation" 
             description="A description..." 
             controls={controls} 
             stats={stats}
          >
             <Recharts.ResponsiveContainer>...</Recharts.ResponsiveContainer>
          </SimFrame>
       );
    };
    render(<ConceptSimulation />);
    
    SELF-CORRECTION / VERIFICATION PROTOCOL:
    1. Did I use <SimFrame>? Yes/No. If No, REWRITE.
    2. CHECK FOR UNDECLARED VARIABLES: Look at every 'for' loop. Did you use 'for(i=0...)'? CHANGE IT TO 'for(let i=0...)'.
    3. CHECK FOR "EXPORTS": Do NOT use 'export default'.
    
    OUTPUT FORMAT:
    - Return ONLY the raw code string. No markdown blocks.
  `;

    try {
        onLog("Uploading data to context window...");
        onLog("Executing reasoning protocols...");

        const parts = [];

        // Special handling for text files
        if (mimeType === 'text/plain') {
            const decodedText = atob(base64Data);
            parts.push({ text: `DATA STREAM:\n${decodedText}` });
        } else {
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
        }

        // Add the main prompt
        parts.push({ text: prompt });

        const response = await callGeminiAPI({
            model: GEMINI_MODEL_REASONING,
            contents: {
                parts: parts
            },
            config: {
                thinkingConfig: {
                    thinkingBudget: 16000
                },
                temperature: 0.5, // Lower temperature for more deterministic/stable code
            }
        });

        onLog("Reasoning sequence complete.");
        onLog("Synthesizing Interface...");

        const text = response.text || "";

        const codeBlockRegex = /```(?:tsx|jsx|javascript|js)?\s*([\s\S]*?)\s*```/;
        const match = text.match(codeBlockRegex);

        let cleanedText = match ? match[1] : text;

        if (!match) {
            cleanedText = cleanedText.replace(/^```tsx/, '').replace(/^```javascript/, '').replace(/^```/, '').replace(/```$/, '');
        }

        onLog("Simulation compiled.");
        return cleanedText;

    } catch (error) {
        console.error("Gemini Error:", error);
        onLog(`FATAL EXCEPTION: ${error instanceof Error ? error.message : "Unknown error"}`);
        throw error;
    }
};

export const fixSimulationCode = async (
    code: string,
    error: string,
    onLog: (msg: string) => void
): Promise<string> => {
    onLog("Initializing Auto-Correction Protocol...");

    const prompt = `
      You are an expert React Engineer. The following React component crashed during execution.
      
      CRASH REPORT:
      ${error}
      
      BROKEN CODE:
      ${code}
      
      TASK:
      1. ANALYZE the error and the code to find the exact bug.
      2. FIX the bug.
      3. SIMPLIFY the component logic if it appears too complex or prone to errors.
      4. Ensure NO LaTeX backslashes are used in text strings.
      5. Ensure 'render(<ConceptSimulation />);' is at the end.
      6. Ensure ALL loops use declared variables (e.g. 'for(let i=0...)').
      7. USE 'lucide-react' for icons. Do not use 'lucide_react'.
      8. IMPORTANT: Keep using the <SimFrame>, <Control>, <Stat> components structure.
      
      OUTPUT FORMAT:
      - Return ONLY the raw code string. No markdown blocks.
    `;

    try {
        const response = await callGeminiAPI({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
        });

        const text = response.text || "";
        const codeBlockRegex = /```(?:tsx|jsx|javascript|js)?\s*([\s\S]*?)\s*```/;
        const match = text.match(codeBlockRegex);

        let cleanedText = match ? match[1] : text;

        if (!match) {
            cleanedText = cleanedText.replace(/^```tsx/, '').replace(/^```javascript/, '').replace(/^```/, '').replace(/```$/, '');
        }

        onLog("Patch applied successfully.");
        return cleanedText;

    } catch (e) {
        console.error("Fix Error:", e);
        onLog("Auto-correction failed.");
        throw e;
    }
};

export const processChat = async (
    userMessage: string,
    history: ChatMessage[],
    contextFile: FileData | null
): Promise<{ text: string }> => {
    try {
        const contents = [];

        // System Instruction
        const systemInstruction = "You are a helpful technical assistant answering questions about the provided file/context. Be concise.";

        // History to Contents
        const recentHistory = history.slice(-10);

        for (const msg of recentHistory) {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            });
        }

        // Current User Message + Context
        const currentParts = [];
        if (contextFile) {
            if (contextFile.type === 'text/plain') {
                const decoded = atob(contextFile.data);
                currentParts.push({ text: `REFERENCE CONTEXT:\n${decoded}\n\n` });
            } else {
                currentParts.push({
                    inlineData: {
                        mimeType: contextFile.type,
                        data: contextFile.data
                    }
                });
                currentParts.push({ text: "REFERENCE CONTEXT: The image/PDF above.\n\n" });
            }
        }
        currentParts.push({ text: userMessage });

        contents.push({
            role: 'user',
            parts: currentParts
        });

        const response = await callGeminiAPI({
            model: 'gemini-2.5-flash',
            config: { systemInstruction },
            contents: contents,
        });

        return { text: response.text || "No response." };

    } catch (error) {
        console.error("Chat Error:", error);
        throw error;
    }
};

// Conversational Architect for defining simulations
export const processArchitectChat = async (
    userMessage: string,
    history: ChatMessage[]
): Promise<{ text: string, action?: { type: 'generate', topic: string } }> => {
    try {
        const systemInstruction = `
            You are a System Architect for a Simulation Engine.
            The user will describe a concept they want to simulate (Physics, Math, CS, Biology, etc.).
            
            PROTOCOL:
            1. If the user's request is VAGUE (e.g. "I want to see gravity"), ASK a clarifying question (e.g. "Do you mean planetary orbits, projectile motion, or free fall?").
            2. If the request is DANGEROUS or VIOLATES SAFETY, politely refuse.
            3. If the request is CLEAR (e.g. "Simulate a double pendulum" or "Show me a bubble sort"), accept it.
            
            GENERATION TRIGGER:
            When you have a clear understanding of the simulation to build, you MUST append this tag to the end of your response:
            <<<GENERATE: {Detailed technical description of the simulation to generate}>>>
            
            IMPORTANT:
            - If the user explicitly asks to "simulate", "create", "generate", or "show" something specific, ALWAYS trigger the generation immediately. Do not ask for confirmation if the topic is reasonably clear.
            - Ensure the description inside the tag is technical and detailed.

            Example:
            User: "Show me how a virus spreads."
            You: "I will generate a simulation of viral spread using an SIR model.
            <<<GENERATE: SIR epidemic model with grid visualization, graph of S-I-R populations over time, and adjustable beta/gamma rates.>>>"
        `;

        const contents = [];
        const recentHistory = history.slice(-6); // Keep it short
        for (const msg of recentHistory) {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            });
        }
        contents.push({ role: 'user', parts: [{ text: userMessage }] });

        const response = await callGeminiAPI({
            model: 'gemini-2.5-flash',
            config: { systemInstruction },
            contents: contents,
        });

        const rawText = response.text || "";
        // Updated regex to handle newlines within the tag ([\s\S]*?)
        const genTagRegex = /<<<GENERATE:([\s\S]*?)>>>/;
        const match = rawText.match(genTagRegex);

        if (match) {
            const topic = match[1].trim();
            const cleanText = rawText.replace(match[0], '').trim();
            return {
                text: cleanText || "Architect Protocol Initiated...",
                action: { type: 'generate', topic }
            };
        }

        return { text: rawText };

    } catch (error) {
        console.error("Architect Error:", error);
        throw error;
    }
};

export const generateSuggestedQuestions = async (contextFile: FileData): Promise<string[]> => {
    try {
        let contextText = "";
        if (contextFile.type === 'text/plain') {
            contextText = atob(contextFile.data);
        } else {
            contextText = `Image/Document: ${contextFile.name}`;
        }

        const prompt = `
            Based on the following scientific/technical context, generate 3 short, analytical questions a user might ask to understand the concept better.
            Keep questions under 10 words.
            Format: Return ONLY a JSON array of strings. Example: ["What is variable X?", "How does Y affect Z?", "Explain the formula"]
            
            CONTEXT:
            ${contextText.substring(0, 1000)}...
        `;

        const response = await callGeminiAPI({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (e) {
        console.warn("Failed to generate suggestions", e);
        return ["Explain the core concept", "What are the variables?", "Real-world applications?"];
    }
}