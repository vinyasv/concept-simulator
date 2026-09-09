import { test } from "node:test";
import assert from "node:assert/strict";
import { parseWorkspaceResponse } from "../services/geminiService";

test("workspace responses use explicit structured actions", () => {
  assert.deepEqual(
    parseWorkspaceResponse(
      '```json\n{"kind":"answer","message":"The queue is full.","buildPrompt":""}\n```',
    ),
    {
      kind: "answer",
      message: "The queue is full.",
      buildPrompt: "",
    },
  );
  assert.deepEqual(
    parseWorkspaceResponse(
      JSON.stringify({
        kind: "update",
        message: "I’ll add a second queue.",
        buildPrompt: "Add a second visible FIFO queue to the current model.",
      }),
    ).kind,
    "update",
  );
});

test("workspace responses reject incomplete build actions", () => {
  assert.throws(() =>
    parseWorkspaceResponse(
      JSON.stringify({
        kind: "create",
        message: "Building it.",
        buildPrompt: "",
      }),
    ),
  );
  assert.throws(() => parseWorkspaceResponse("not json"));
});
