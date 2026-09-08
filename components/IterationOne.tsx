import React, { useState } from "react";
import { ArrowRight, BookOpen, PanelRightOpen, RotateCcw } from "lucide-react";
import { SimulationWorkspace } from "../hooks/useSimulationWorkspace";
import { AppStatus, FileData, LibraryItem } from "../types";
import ConceptCreator from "./ConceptCreator";
import FreshAssistant from "./FreshAssistant";
import FreshLibrary from "./FreshLibrary";
import SimulationCanvas from "./SimulationCanvas";

interface IterationOneProps {
  workspace: SimulationWorkspace;
}

type OpenPanel = "library" | "create" | null;

const toFileData = (topic: string): FileData => {
  const name =
    topic
      .split(/[.!?\n]/)[0]
      .trim()
      .slice(0, 56)
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_|_$/g, "")
      .toLowerCase() || "custom_concept";

  return {
    name: `${name}.txt`,
    type: "text/plain",
    data: btoa(unescape(encodeURIComponent(topic))),
    category: "Custom",
  };
};

const IterationOne: React.FC<IterationOneProps> = ({ workspace }) => {
  const [panel, setPanel] = useState<OpenPanel>(null);
  const [assistantOpen, setAssistantOpen] = useState(
    () => window.innerWidth > 800,
  );
  const [prompt, setPrompt] = useState("");
  const [creatorSeed, setCreatorSeed] = useState("");

  const openCreator = (seed = "") => {
    setCreatorSeed(seed);
    setPanel("create");
  };

  const selectItem = (item: LibraryItem) => {
    workspace.selectLibraryItem(item);
    setPanel(null);
  };

  const selectFile = (file: FileData) => {
    void workspace.selectFile(file);
    setPanel(null);
  };

  const generateConcept = (topic: string) => {
    setPanel(null);
    setPrompt("");
    void workspace.selectFile(toFileData(topic));
  };

  const generateFromConversation = (
    topic: string,
    mode: "create" | "update",
  ) => {
    const nextFile =
      mode === "update" && workspace.currentFile
        ? {
            ...workspace.currentFile,
            type: "text/plain",
            data: btoa(unescape(encodeURIComponent(topic))),
            category: "Custom",
          }
        : toFileData(topic);

    void workspace.selectFile(nextFile);
  };

  const submitPrompt = (event: React.FormEvent) => {
    event.preventDefault();
    const nextPrompt = prompt.trim();
    if (!nextPrompt) return;
    openCreator(nextPrompt);
  };

  const reset = () => {
    setAssistantOpen(false);
    setPanel(null);
    workspace.reset();
  };

  return (
    <div className="concept-one">
      <header className="minimal-header">
        <a className="minimal-brand" href="/">
          Concept Simulator
        </a>
        <div className="minimal-header-actions">
          {workspace.currentFile && (
            <button
              className="minimal-header__library"
              onClick={() => setAssistantOpen(!assistantOpen)}
              type="button"
              aria-expanded={assistantOpen}
            >
              <PanelRightOpen size={14} /> Assistant
            </button>
          )}
          <button
            className="minimal-header__library"
            onClick={() => setPanel("library")}
            type="button"
          >
            <BookOpen size={14} /> Library
          </button>
        </div>
      </header>

      <main
        className={`minimal-main ${workspace.currentFile ? "has-simulation" : ""}`}
      >
        {!workspace.currentFile ? (
          <section className="minimal-start">
            <p className="minimal-kicker">Interactive simulations</p>
            <h1>
              What do you want
              <br />
              to simulate?
            </h1>
            <form className="minimal-prompt" onSubmit={submitPrompt}>
              <label className="visually-hidden" htmlFor="start-concept">
                Describe a concept
              </label>
              <input
                autoFocus
                id="start-concept"
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Try: How does gravity affect an orbit?"
                value={prompt}
              />
              <button
                disabled={!prompt.trim()}
                type="submit"
                aria-label="Continue"
              >
                <ArrowRight size={17} />
              </button>
            </form>
            <button
              className="minimal-browse"
              onClick={() => setPanel("library")}
              type="button"
            >
              Browse simulations
            </button>
          </section>
        ) : (
          <section className="minimal-simulation">
            <div
              className={`minimal-workspace ${assistantOpen ? "has-thread" : "is-thread-collapsed"}`}
            >
              <div className="minimal-simulation__canvas">
                {workspace.isProcessing ? (
                  <div className="minimal-build-state" role="status">
                    <span />
                    <p>Building your simulation</p>
                    <small>
                      {workspace.latestLog?.message ?? "Reading your concept"}
                    </small>
                  </div>
                ) : workspace.status === AppStatus.ERROR ? (
                  <div className="minimal-build-state is-error" role="alert">
                    <p>Could not build this simulation.</p>
                    <small>
                      {workspace.latestLog?.message ??
                        "Try describing the concept another way."}
                    </small>
                    <button
                      onClick={() => setAssistantOpen(true)}
                      type="button"
                    >
                      Edit your request
                    </button>
                  </div>
                ) : (
                  <SimulationCanvas
                    code={workspace.simulationCode}
                    onSnapshot={workspace.setSimulationSnapshot}
                    isCached={workspace.isCachedSession}
                    onError={workspace.handleSimulationError}
                    showToolbar={false}
                  />
                )}
              </div>
              <aside className="minimal-thread-shell">
                <div
                  className="minimal-thread-content"
                  aria-hidden={!assistantOpen}
                  inert={!assistantOpen ? true : undefined}
                >
                  <FreshAssistant
                    file={workspace.currentFile}
                    simulationSnapshot={workspace.simulationSnapshot}
                    isProcessing={workspace.isProcessing}
                    mode="workspace"
                    onClose={() => setAssistantOpen(false)}
                    onGenerate={generateFromConversation}
                    suggestions={workspace.suggestions}
                  />
                </div>
              </aside>
            </div>

            <footer className="minimal-footer">
              <span>
                {workspace.isProcessing
                  ? "Generating"
                  : (workspace.latestLog?.message ?? "Ready")}
              </span>
              <button onClick={reset} type="button">
                <RotateCcw size={13} /> Start over
              </button>
            </footer>
          </section>
        )}
      </main>

      {panel && (
        <div className="minimal-overlay">
          <button
            className="surface-scrim"
            onClick={() => setPanel(null)}
            aria-label="Dismiss panel"
          />
          <div className="minimal-side-sheet">
            {panel === "library" ? (
              <FreshLibrary
                activeFile={workspace.currentFile}
                isProcessing={workspace.isProcessing}
                mode="palette"
                onClose={() => setPanel(null)}
                onCreateNew={() => openCreator()}
                onFileSelect={selectFile}
                onItemSelect={selectItem}
              />
            ) : (
              <ConceptCreator
                initialPrompt={creatorSeed}
                isProcessing={workspace.isProcessing}
                onBrowse={() => setPanel("library")}
                onClose={() => setPanel(null)}
                onGenerate={generateConcept}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IterationOne;
