export type Model = {
  id: string;
  name: string;
  provider: string;
  sdkModelId: string;
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
    sdkModelId: "gpt-4o",
    color: "#a78bfa",
    keyLabel: "OPENAI_API_KEY",
    shortCode: "GP",
  },
  {
    id: "claude",
    name: "Claude",
    provider: "Anthropic",
    sdkModelId: "claude-3-5-sonnet-latest",
    color: "#f472b6",
    keyLabel: "ANTHROPIC_API_KEY",
    shortCode: "CL",
  },
  {
    id: "gemini",
    name: "Gemini",
    provider: "Google",
    sdkModelId: "gemini-2.0-flash",
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

export const STORAGE_KEYS = {
  apiKeys: "open-circle-api-keys",
} as const;
