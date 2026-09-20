import test from "node:test";
import assert from "node:assert/strict";

import { parseSseBuffer } from "../src/utils/sse.js";

test("parses complete SSE events and keeps an incomplete remainder", () => {
  const result = parseSseBuffer(
    'data: {"type":"meta","conversationId":"123"}\n\n' +
      'data: {"type":"content","text":"hel',
  );

  assert.deepEqual(result.events, [
    {
      type: "meta",
      conversationId: "123",
    },
  ]);
  assert.equal(result.remainder, 'data: {"type":"content","text":"hel');
});

test("supports CRLF event boundaries and ignores malformed JSON", () => {
  const result = parseSseBuffer(
    'data: invalid\r\n\r\ndata: {"type":"complete"}\r\n\r\n',
  );

  assert.deepEqual(result.events, [
    {
      type: "complete",
    },
  ]);
  assert.equal(result.remainder, "");
});
