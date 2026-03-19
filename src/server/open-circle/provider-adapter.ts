import type { LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

import { MODELS } from "@/lib/open-circle/constants";

type ProviderAdapterInput = {
  modelId: string;
  apiKey: string;
};

export function getModelMetadata(modelId: string) {
  return MODELS.find((model) => model.id === modelId);
}

export function getLanguageModel({
  modelId,
  apiKey,
}: ProviderAdapterInput): LanguageModel {
  const model = getModelMetadata(modelId);

  if (!model) {
    throw new Error(`Unsupported model id: ${modelId}`);
  }

  if (!apiKey.trim()) {
    throw new Error(`Missing API key for ${model.name}`);
  }

  if (model.provider === "OpenAI") {
    const openai = createOpenAI({ apiKey });
    return openai(model.sdkModelId);
  }

  if (model.provider === "Anthropic") {
    const anthropic = createAnthropic({ apiKey });
    return anthropic(model.sdkModelId);
  }

  if (model.provider === "Google") {
    const google = createGoogleGenerativeAI({ apiKey });
    return google(model.sdkModelId);
  }

  throw new Error(`Provider is not configured for ${model.name}`);
}
