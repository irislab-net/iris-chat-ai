/**
 * Corpus inventory for assistant rendering — every shape the model returns
 * must have a fixture and a deliberate render path.
 */

export type FixtureKind =
  | "nested_list_ladder"
  | "ascii_tree"
  | "fenced_pocket_ladder"
  | "gfm_table_en"
  | "gfm_table_fa"
  | "fa_level_board"
  | "hr_mixed_en_fa"
  | "blockquote_numbered_inline"
  | "real_js_fence"
  | "wait_prose"
  | "empty_show_trade_signal"
  | "empty_no_trade"
  | "hybrid_prose_no_trade"
  | "live_signal_no_trade_action"
  | "thinking_with_tools"
  | "thinking_tools_only"

export type CorpusFixture = {
  id: string
  kind: FixtureKind
  /** Relative to this directory */
  path: string
  /** How the turn body should be classified after normalize+segment */
  expectedBody:
    | "markdown"
    | "tree"
    | "table"
    | "code"
    | "empty"
    | "mixed"
  hasClientAction?: "show_trade_signal" | "no_trade"
  hasSseTranscript?: boolean
}

export const ASSISTANT_RENDER_FIXTURES: CorpusFixture[] = [
  {
    id: "2475",
    kind: "nested_list_ladder",
    path: "history/2475.md",
    expectedBody: "markdown",
  },
  {
    id: "2477",
    kind: "ascii_tree",
    path: "history/2477.md",
    expectedBody: "tree",
  },
  {
    id: "1672",
    kind: "fenced_pocket_ladder",
    path: "history/1672.md",
    expectedBody: "tree",
  },
  {
    id: "1674",
    kind: "fenced_pocket_ladder",
    path: "history/1674.md",
    expectedBody: "tree",
  },
  {
    id: "2479",
    kind: "gfm_table_en",
    path: "history/2479.md",
    expectedBody: "table",
  },
  {
    id: "fa_table_list",
    kind: "gfm_table_fa",
    path: "live/fa_table_list.md",
    expectedBody: "table",
    hasSseTranscript: true,
  },
  {
    id: "2481",
    kind: "fa_level_board",
    path: "history/2481.md",
    expectedBody: "markdown",
  },
  {
    id: "hr_mixed_en_fa",
    kind: "hr_mixed_en_fa",
    path: "live/hr_mixed_en_fa.md",
    expectedBody: "markdown",
    hasSseTranscript: true,
  },
  {
    id: "blockquote_inline_numbered",
    kind: "blockquote_numbered_inline",
    path: "live/blockquote_inline_numbered.md",
    expectedBody: "markdown",
    hasSseTranscript: true,
  },
  {
    id: "real_js_fence",
    kind: "real_js_fence",
    path: "live/real_js_fence.md",
    expectedBody: "code",
    hasSseTranscript: true,
  },
  {
    id: "no_trade_wait",
    kind: "wait_prose",
    path: "live/no_trade_wait.md",
    expectedBody: "markdown",
    hasSseTranscript: true,
  },
  {
    id: "1741",
    kind: "empty_show_trade_signal",
    path: "history/1741.json",
    expectedBody: "empty",
    hasClientAction: "show_trade_signal",
  },
  {
    id: "1745",
    kind: "empty_no_trade",
    path: "history/1745.json",
    expectedBody: "empty",
    hasClientAction: "no_trade",
  },
  {
    id: "1660",
    kind: "hybrid_prose_no_trade",
    path: "history/1660.json",
    expectedBody: "markdown",
    hasClientAction: "no_trade",
  },
  {
    id: "signal_card",
    kind: "live_signal_no_trade_action",
    path: "live/signal_card.json",
    expectedBody: "empty",
    hasClientAction: "no_trade",
    hasSseTranscript: true,
  },
  {
    id: "thinking_blockquote",
    kind: "thinking_with_tools",
    path: "live/blockquote_inline_numbered.json",
    expectedBody: "markdown",
    hasSseTranscript: true,
  },
  {
    id: "thinking_tools_only",
    kind: "thinking_tools_only",
    path: "live/fa_table_list.json",
    expectedBody: "table",
    hasSseTranscript: true,
  },
]
