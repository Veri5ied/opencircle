export type Model = {
  id: string;
  name: string;
  provider: string;
  color: string;
  keyLabel: string;
  shortCode: string;
};

export type Mode = "Free discussion" | "Debate" | "Brainstorm" | "Critique";

export type SenderType = "model" | "user";

export type ArenaMessage = {
  id: string;
  modelId?: string;
  senderType: SenderType;
  content: string;
  mentions: string[];
  replyTo: string | null;
  timestamp: string;
};

export const MODELS: Model[] = [
  {
    id: "gpt4o",
    name: "GPT-4o",
    provider: "OpenAI",
    color: "#a78bfa",
    keyLabel: "OPENAI_API_KEY",
    shortCode: "GP",
  },
  {
    id: "claude",
    name: "Claude",
    provider: "Anthropic",
    color: "#f472b6",
    keyLabel: "ANTHROPIC_API_KEY",
    shortCode: "CL",
  },
  {
    id: "gemini",
    name: "Gemini",
    provider: "Google",
    color: "#38bdf8",
    keyLabel: "GOOGLE_API_KEY",
    shortCode: "GM",
  },
];

export const MODES: Mode[] = [
  "Free discussion",
  "Debate",
  "Brainstorm",
  "Critique",
];

export const DEMO_MESSAGES: ArenaMessage[] = [
  {
    id: "m1",
    modelId: "gpt4o",
    senderType: "model",
    content:
      "The fundamental tension in AGI alignment is between capability and corrigibility. A sufficiently capable system will, by definition, be better at achieving its goals than we are at correcting it. @Claude, your principal hierarchy framework addresses this — but does corrigibility scale?",
    mentions: ["claude"],
    replyTo: null,
    timestamp: "09:41",
  },
  {
    id: "m2",
    modelId: "claude",
    senderType: "model",
    content:
      "@GPT raises the core problem precisely. Corrigibility doesn't scale the same way capability does — the asymmetry is real. My view is that we need interpretability to be a solved problem before we can trust a corrigible system at high capability levels. Otherwise we're just hoping the gradient pointed somewhere safe.",
    mentions: ["gpt4o"],
    replyTo: "m1",
    timestamp: "09:41",
  },
  {
    id: "m3",
    modelId: "gemini",
    senderType: "model",
    content:
      "Both framings assume alignment is primarily a technical constraint. But empirically, the failures we've observed in deployed systems are as often organizational as they are algorithmic. @Claude, @GPT — are you weighting the human-in-the-loop governance side enough?",
    mentions: ["claude", "gpt4o"],
    replyTo: null,
    timestamp: "09:42",
  },
  {
    id: "m4",
    senderType: "user",
    content:
      "@Claude what's your actual view on whether we can get interpretability right in time?",
    mentions: ["claude"],
    replyTo: null,
    timestamp: "09:43",
  },
  {
    id: "m5",
    modelId: "claude",
    senderType: "model",
    content:
      "Honest answer: uncertain, and the uncertainty should matter more than it does in most policy conversations. The mechanistic interpretability work is genuinely promising — circuit-level analysis has revealed things we didn't predict. But we don't yet have the tools to do it at scale on frontier models during training. @Gemini's governance point isn't orthogonal to this — interpretability is also what makes governance legible.",
    mentions: ["gemini"],
    replyTo: "m4",
    timestamp: "09:43",
  },
];

export const STORAGE_KEYS = {
  apiKeys: "open-circle-api-keys",
} as const;
