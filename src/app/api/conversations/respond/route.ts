import { generateText } from "ai";
import { z } from "zod";

import {
  MODELS,
  type ArenaMessage,
  type Mode,
} from "@/lib/open-circle/constants";
import {
  getLanguageModel,
  getModelMetadata,
} from "@/server/open-circle/provider-adapter";

const modeSchema = z.enum([
  "Free discussion",
  "Debate",
  "Brainstorm",
  "Critique",
]);

const messageSchema = z.object({
  id: z.string(),
  modelId: z.string().optional(),
  senderType: z.enum(["model", "user"]),
  content: z.string(),
  mentions: z.array(z.string()).default([]),
  replyTo: z.string().nullable().optional(),
  timestamp: z.string().optional(),
});

const requestSchema = z.object({
  topic: z.string().min(1),
  mode: modeSchema,
  targetModelId: z.string(),
  targetApiKey: z.string().min(1),
  selectedModelIds: z.array(z.string()).min(1),
  messages: z.array(messageSchema).max(100).default([]),
  purpose: z.enum(["opening", "reply"]),
});

function getSpeakerName(message: ArenaMessage): string {
  if (message.senderType === "user") {
    return "User";
  }

  const model = message.modelId
    ? MODELS.find((item) => item.id === message.modelId)
    : null;
  return model?.name ?? "Model";
}

function buildTranscript(messages: ArenaMessage[]): string {
  if (messages.length === 0) {
    return "No prior messages.";
  }

  return messages
    .slice(-12)
    .map((message) => `${getSpeakerName(message)}: ${message.content}`)
    .join("\n");
}

function buildSystemPrompt({
  topic,
  mode,
  targetModelName,
  participants,
}: {
  topic: string;
  mode: Mode;
  targetModelName: string;
  participants: string[];
}): string {
  return [
    `You are ${targetModelName} in a live multi-LLM room called OpenCircle.`,
    `Topic: ${topic}`,
    `Mode: ${mode}`,
    `Participants: ${participants.join(", ")}`,
    "Write concise, conversational chat replies.",
    "When you directly address another participant, mention them with @Name.",
    "Do not claim another participant said something they did not say.",
    "Keep momentum and avoid long essays.",
  ].join("\n");
}

function buildPrompt({
  topic,
  purpose,
  transcript,
}: {
  topic: string;
  purpose: "opening" | "reply";
  transcript: string;
}): string {
  if (purpose === "opening") {
    return [
      `Topic: ${topic}`,
      "Give your opening thought in 2-4 sentences.",
      "Invite at least one other model by @mention when useful.",
    ].join("\n");
  }

  return [
    `Topic: ${topic}`,
    "Conversation transcript:",
    transcript,
    "Reply to the latest message in 2-5 sentences.",
  ].join("\n\n");
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      topic,
      mode,
      messages,
      purpose,
      targetModelId,
      selectedModelIds,
      targetApiKey,
    } = parsed.data;

    const targetModel = getModelMetadata(targetModelId);

    if (!targetModel) {
      return Response.json(
        { error: "Target model not found" },
        { status: 404 },
      );
    }

    const participants = MODELS.filter((model) =>
      selectedModelIds.includes(model.id),
    ).map((model) => model.name);

    const normalizedMessages: ArenaMessage[] = messages.map((message) => ({
      id: message.id,
      modelId: message.modelId,
      senderType: message.senderType,
      content: message.content,
      mentions: message.mentions ?? [],
      replyTo: message.replyTo ?? null,
      timestamp: message.timestamp ?? "",
    }));

    const transcript = buildTranscript(normalizedMessages);
    const model = getLanguageModel({
      modelId: targetModel.id,
      apiKey: targetApiKey,
    });

    const result = await generateText({
      model,
      system: buildSystemPrompt({
        topic,
        mode,
        targetModelName: targetModel.name,
        participants:
          participants.length > 0 ? participants : [targetModel.name],
      }),
      prompt: buildPrompt({ topic, purpose, transcript }),
      temperature: 0.7,
      maxOutputTokens: 280,
    });

    return Response.json({
      text: result.text.trim(),
      modelId: targetModel.id,
    });
  } catch {
    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}
