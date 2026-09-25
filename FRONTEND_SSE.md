# Frontend integration — SSE chat stream

Use this to wire **live progress** (reasoning + server tools) while a chat turn is still running. Auth, request body, credits, cards, and the final payload match [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) `POST /message`. Replies, timestamps, and `client_actions` replay stay as in [FRONTEND_UPDATES.md](FRONTEND_UPDATES.md).

Base path: `/v1/chat`.

---

## When to use which endpoint

| Endpoint | Response | Use |
|----------|----------|-----|
| `POST /v1/chat/message` | One JSON body when the turn finishes | Fine if you only need the final bubble |
| `POST /v1/chat/message/stream` | `text/event-stream` while the model loop runs, then the same JSON as `/message` | Show “thinking”, reasoning, and MCP tool names **before** `output_text` exists |

The stream does **not** token-stream the assistant answer. `output_text`, `client_actions`, `suggested_actions`, and message ids arrive only on the terminal `done` event.

Do **not** use the browser `EventSource` API. It is GET-only and cannot send a JSON body or `Authorization`. Use `fetch` + `ReadableStream`.

---

## Request

Same as `POST /message`: JWT, guest token, or local `DEV_AUTH_BYPASS`. Same JSON body (`session_id`, `message`, optional `effort`, `client_context`, `reply_to_id`).

```http
POST /v1/chat/message/stream
Authorization: Bearer <token>
Content-Type: application/json
Accept: text/event-stream
```

```json
{
  "session_id": "11111111-1111-1111-1111-111111111111",
  "message": "@signal ETH",
  "effort": "normal",
  "client_context": {
    "active_page": "chat",
    "active_symbol": "ETH",
    "available_ui_actions": ["show_trade_signal", "no_trade"]
  }
}
```

Guest users may only send `effort: "normal"` (same as `/message`). Invalid guest effort is a **JSON** `400` with `code: "effort_not_allowed"` — the SSE stream never starts.

---

## Two error shapes

Validation, auth, and “streaming not supported” happen **before** SSE headers. Those responses are the usual JSON error envelope (`sendAPIError`), not `event: error`.

After headers are sent, failures are SSE:

```
event: error
data: {"message":"agent execution failed","code":""}

```

Then the connection closes. Treat `event: error` like a failed `/message` (show `message`, keep the composer enabled, restore a reply chip if you cleared it).

| When | Content-Type | How to read |
|------|----------------|-------------|
| Auth / body / guest effort / `stream_unsupported` | JSON | `response.ok === false`, parse JSON error |
| Credit / guest quota / agent failure **after** the stream opened | `text/event-stream` | `event: error` |

There is **no heartbeat comment**. The first SSE bytes may arrive only after the first model pass (reasoning), first MCP tool, `done`, or `error`. Show a local spinner as soon as you `fetch`.

Aborting the `fetch` (`AbortController`) cancels the request context and stops the turn on the server. Credits reserved for a registered user are released if the agent errors; a client abort mid-turn may still consume work already done — do not assume a refund on every cancel.

---

## Wire format

Each event is one SSE record: `event:` name, `data:` one JSON object, blank line. The server flushes after every event (`X-Accel-Buffering: no`).

```
event: reasoning
data: {"text":"...this pass only..."}

event: tool
data: {"tool":"get_market_state"}

event: tool
data: {"tool":"get_model_intelligence"}

event: done
data: { ...same object as POST /message... }

```

### Events

| `event` | `data` | When | UI |
|---------|--------|------|----|
| `reasoning` | `{ "text": string }` | After a model pass that returned hidden reasoning (including continuation passes) | Append to a collapsible “Thinking” block. **`text` is that pass only**, not the full transcript. |
| `tool` | `{ "tool": string }` | After a **server/MCP** tool **returns** | Show a status chip with the tool name. **No input/output.** |
| `done` | Full `ChatResponse` | Turn succeeded | Replace the placeholder with `output_text`, run `client_actions`, stamp `user_message` / `assistant_message`, update credits/trial. |
| `error` | `{ "message": string, "code"?: string }` | Turn failed after the stream started | Error toast; do not leave a fake assistant bubble. |

`done` is the source of truth. It includes joined `reasoning` (all passes, `\n\n` between them), completed `tool_calls` (with outputs), `client_actions`, `suggested_actions`, tokens, metadata, and persist refs.

---

## What is **not** streamed

- Assistant `output_text` (markdown) — only on `done`.
- `show_trade_signal` / `no_trade` / other **client** tools — only on `done.client_actions`. They never emit `event: tool`.
- Follow-up chips — only on `done.suggested_actions`.
- MCP tool **arguments or results** — live `tool` events are names only. Full `tool_calls[]` is on `done`.
- Token deltas / `data: [DONE]` OpenAI-style chunks.

Typical `@signal` sequence: `reasoning` → `tool` (`get_market_state`) → `reasoning` → `tool` (`get_model_intelligence`) → `done` with a card in `client_actions` and often empty `output_text`.

---

## UI flow

```
user sends message
        │
        ▼
optimistic user bubble + spinner (“Working…”)
        │
        ▼
POST /message/stream  ──►  reasoning  → append thinking (hidden by default)
                      ──►  tool       → “Using get_market_state…”
                      ──►  done       → assistant bubble + cards + chips
                      ──►  error      → system error, no assistant row
```

1. Optimistic user bubble is OK. After `done`, set `id` / `created_at` from `user_message` (never `Date.now()`).
2. Keep reasoning **collapsed**. Do not treat it as the answer or as a card. The same full string is stored on the assistant row and returned by `GET /history` as `reasoning`.
3. On `done`, if you accumulated live `reasoning` chunks, prefer **`done.reasoning`** for the final details block (already joined).
4. Run `client_actions` with the same handlers as `/message`. Card-only turns may have empty `output_text`.
5. Suggested chips: same rules as live `/message` (not restored from history; guest taps consume a trial message).
6. If `done` never arrives and the stream ends, treat it as a network/timeout failure.

---

## TypeScript

```ts
type StreamEvent =
  | { event: "reasoning"; data: { text: string } }
  | { event: "tool"; data: { tool: string } }
  | { event: "error"; data: { message: string; code?: string } }
  | { event: "done"; data: ChatResponse }; // same shape as POST /message

async function postMessageStream(
  url: string, // e.g. "/v1/chat/message/stream"
  token: string,
  body: unknown,
  onEvent: (ev: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
    signal,
  });

  const ctype = res.headers.get("content-type") || "";
  if (!res.ok || !ctype.includes("text/event-stream")) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error || res.statusText), {
      code: err.code,
      status: res.status,
    });
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let donePayload: ChatResponse | undefined;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() || "";
    for (const block of parts) {
      const ev = parseSseBlock(block);
      if (!ev) continue;
      onEvent(ev);
      if (ev.event === "error") {
        throw Object.assign(new Error(ev.data.message), { code: ev.data.code });
      }
      if (ev.event === "done") donePayload = ev.data;
    }
  }

  if (!donePayload) throw new Error("stream closed without done");
  return donePayload;
}

function parseSseBlock(block: string): StreamEvent | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  if (!dataLines.length) return null;
  const data = JSON.parse(dataLines.join("\n"));
  return { event, data } as StreamEvent;
}
```

Example handlers:

```ts
let thinking = "";

await postMessageStream(url, token, body, (ev) => {
  if (ev.event === "reasoning") {
    thinking = thinking ? thinking + "\n\n" + ev.data.text : ev.data.text;
    renderThinking(thinking); // collapsed <details>
  }
  if (ev.event === "tool") {
    setStatus(`Using ${ev.data.tool}…`);
  }
  if (ev.event === "done") {
    renderThinking(ev.data.reasoning || thinking);
    renderAssistant(ev.data.output_text, ev.data.assistant_message);
    executeClientActions(ev.data.client_actions || []);
    setSuggestChips(ev.data.suggested_actions || []);
  }
});
```

---

## History after a streamed turn

`GET /history` does not replay live `tool` ticks. Assistant rows may include:

- `content` — `output_text` (may be `""` for card-only)
- `reasoning` — full joined thinking
- `client_actions` — cards to replay

Rebuild the bubble from those fields the same way as a non-streamed turn.

---

## Checklist

- [ ] `fetch` POST with Bearer; not `EventSource`
- [ ] Handle JSON errors when `Content-Type` is not SSE
- [ ] Spinner immediately; first SSE event can be delayed
- [ ] Append `reasoning.text` per event; on `done` use `data.reasoning`
- [ ] Show MCP names from `tool`; do not expect tool payloads
- [ ] On `done`, same pipeline as `/message` (persist ids, cards, chips, credits)
- [ ] On `error` or abort, no fake assistant `id`
- [ ] Proxies: allow `text/event-stream` and do not buffer (`X-Accel-Buffering: no` is already set)
