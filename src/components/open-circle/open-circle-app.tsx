"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  MODELS,
  STORAGE_KEYS,
  type ArenaMessage,
  type Mode,
  type Model,
} from "@/lib/open-circle/constants";
import { generateRandomId } from "@/lib/open-circle/generate-random-id";

import { ApiKeysModal } from "./api-keys-modal";
import { ArenaHeader } from "./arena-header";
import { ArenaSidebar } from "./arena-sidebar";
import { ConversationView } from "./conversation-view";
import { LandingView } from "./landing-view";

type OpenCircleAppProps = {
  pageMode: "home" | "circle";
  initialTopic?: string;
  initialMode?: Mode;
  initialSelectedModels?: string[];
};

type ApiKeyMap = Record<string, string>;

type RespondPurpose = "opening" | "reply";
type RespondMutationInput = {
  topic: string;
  mode: Mode;
  targetModelId: string;
  targetApiKey: string;
  selectedModelIds: string[];
  messages: ArenaMessage[];
  purpose: RespondPurpose;
  signal?: AbortSignal;
};
type RespondMutationOutput = {
  text: string;
  modelId: string;
};

const GENERATION_CANCELLED_ERROR = "Generation cancelled";
const MIN_AUTO_CONTINUE_TURNS = 8;
const MAX_AUTO_CONTINUE_TURNS = 24;

function timestampNow() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSystemNotice(content: string): ArenaMessage {
  return {
    id: createMessageId("sys"),
    senderType: "user",
    content: `System: ${content}`,
    mentions: [],
    replyTo: null,
    timestamp: timestampNow(),
  };
}

function isGenerationCancelledError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" ||
      error.message === GENERATION_CANCELLED_ERROR)
  );
}

function findMentionedModelInText(text: string, models: Model[]): Model | null {
  const lowerText = text.toLowerCase();

  return (
    models.find(
      (model) =>
        lowerText.includes(`@${model.name.toLowerCase()}`) ||
        lowerText.includes(`@${model.id.toLowerCase()}`),
    ) ?? null
  );
}

function getLastModelMessageIndex(
  messages: ArenaMessage[],
  modelId: string,
): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].modelId === modelId) {
      return index;
    }
  }

  return -1;
}

function resolveAutoTurnBudget(modelCount: number) {
  return Math.min(
    MAX_AUTO_CONTINUE_TURNS,
    Math.max(MIN_AUTO_CONTINUE_TURNS, modelCount * 3),
  );
}

function findMessageById(messages: ArenaMessage[], messageId: string | null) {
  if (!messageId) {
    return null;
  }

  return messages.find((message) => message.id === messageId) ?? null;
}

export function OpenCircleApp({
  pageMode,
  initialTopic,
  initialMode,
  initialSelectedModels,
}: OpenCircleAppProps) {
  const router = useRouter();
  const threadRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<ArenaMessage[]>([]);
  const generationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const activeRequestAbortRef = useRef<AbortController | null>(null);
  const openingRunIdRef = useRef(0);
  const hasBootstrappedConversationRef = useRef(false);

  const initialSelectionKey = useMemo(
    () => (initialSelectedModels ?? []).join(","),
    [initialSelectedModels],
  );
  const normalizedInitialSelectedModels = useMemo(() => {
    const parsed = initialSelectionKey
      .split(",")
      .map((modelId) => modelId.trim())
      .filter(Boolean);

    return parsed.length >= 2 ? parsed : ["gpt4o", "claude"];
  }, [initialSelectionKey]);

  const [showKeys, setShowKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyMap>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.apiKeys);
      return raw ? (JSON.parse(raw) as ApiKeyMap) : {};
    } catch {
      window.localStorage.removeItem(STORAGE_KEYS.apiKeys);
      return {};
    }
  });
  const [selectedModels, setSelectedModels] = useState<string[]>(
    normalizedInitialSelectedModels,
  );
  const [selectedMode, setSelectedMode] = useState<Mode>(
    initialMode ?? "Free discussion",
  );
  const [topic, setTopic] = useState(initialTopic ?? "");
  const [started, setStarted] = useState(pageMode === "circle");
  const [messages, setMessages] = useState<ArenaMessage[]>([]);
  const [composerVal, setComposerVal] = useState("");
  const [streaming, setStreaming] = useState<Model | null>(null);
  const [replyTo, setReplyTo] = useState<ArenaMessage | null>(null);

  const { mutateAsync: runRespondMutation } = useMutation<
    RespondMutationOutput,
    Error,
    RespondMutationInput
  >({
    mutationFn: async ({ signal, ...body }) => {
      const response = await fetch("/api/conversations/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal,
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as {
        text?: string;
        modelId?: string;
        error?: string;
      };

      if (!response.ok || !payload.text?.trim()) {
        throw new Error(payload.error ?? "Failed to generate response");
      }

      return {
        text: payload.text.trim(),
        modelId: payload.modelId ?? body.targetModelId,
      };
    },
  });

  const replaceMessages = useCallback((nextMessages: ArenaMessage[]) => {
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
  }, []);

  const appendMessage = useCallback((nextMessage: ArenaMessage) => {
    setMessages((previous) => {
      const nextMessages = [...previous, nextMessage];
      messagesRef.current = nextMessages;
      return nextMessages;
    });
  }, []);

  const enqueueGeneration = useCallback(
    (task: () => Promise<void>) => {
      generationQueueRef.current = generationQueueRef.current
        .then(task)
        .catch((error) => {
          if (!isGenerationCancelledError(error)) {
            appendMessage(
              createSystemNotice(
                error instanceof Error
                  ? error.message
                  : "Unexpected generation error occurred.",
              ),
            );
          }
        })
        .finally(() => {
          setStreaming(null);
        });

      return generationQueueRef.current;
    },
    [appendMessage],
  );

  const activeModels = useMemo(
    () => MODELS.filter((model) => selectedModels.includes(model.id)),
    [selectedModels],
  );

  const scrollThreadToBottom = useCallback(() => {
    if (!threadRef.current) {
      return;
    }

    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      scrollThreadToBottom();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [messages, scrollThreadToBottom, started, streaming]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    setStarted(pageMode === "circle");
  }, [pageMode]);

  useEffect(() => {
    if (pageMode !== "circle") {
      hasBootstrappedConversationRef.current = false;
      openingRunIdRef.current += 1;
      activeRequestAbortRef.current?.abort();
      return;
    }

    hasBootstrappedConversationRef.current = false;
    openingRunIdRef.current += 1;
    activeRequestAbortRef.current?.abort();
    setTopic(initialTopic ?? "");
    setSelectedMode(initialMode ?? "Free discussion");
    setSelectedModels(normalizedInitialSelectedModels);
    replaceMessages([]);
    setReplyTo(null);
    setStreaming(null);
  }, [
    initialMode,
    initialSelectionKey,
    initialTopic,
    normalizedInitialSelectedModels,
    pageMode,
    replaceMessages,
  ]);

  const saveApiKeys = (nextKeys: ApiKeyMap) => {
    setApiKeys(nextKeys);
    window.localStorage.setItem(STORAGE_KEYS.apiKeys, JSON.stringify(nextKeys));
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels((previous) =>
      previous.includes(modelId)
        ? previous.length > 2
          ? previous.filter((currentId) => currentId !== modelId)
          : previous
        : [...previous, modelId],
    );
  };

  const requestModelResponse = useCallback(
    async ({
      targetModel,
      contextMessages,
      purpose,
      replyToMessageId,
    }: {
      targetModel: Model;
      contextMessages: ArenaMessage[];
      purpose: RespondPurpose;
      replyToMessageId?: string;
    }) => {
      const targetApiKey = apiKeys[targetModel.id]?.trim();

      if (!targetApiKey) {
        throw new Error(`Missing API key for ${targetModel.name}`);
      }

      const abortController = new AbortController();
      activeRequestAbortRef.current = abortController;
      let payload: RespondMutationOutput;

      try {
        payload = await runRespondMutation({
          topic,
          mode: selectedMode,
          targetModelId: targetModel.id,
          targetApiKey,
          selectedModelIds: activeModels.map((model) => model.id),
          messages: contextMessages,
          purpose,
          signal: abortController.signal,
        });
      } catch (error) {
        if (isGenerationCancelledError(error)) {
          throw new Error(GENERATION_CANCELLED_ERROR);
        }

        throw error;
      } finally {
        if (activeRequestAbortRef.current === abortController) {
          activeRequestAbortRef.current = null;
        }
      }

      return {
        id: createMessageId("m"),
        modelId: targetModel.id,
        senderType: "model" as const,
        content: payload.text.trim(),
        mentions: [],
        replyTo: replyToMessageId ?? null,
        timestamp: timestampNow(),
      };
    },
    [activeModels, apiKeys, runRespondMutation, selectedMode, topic],
  );

  const selectNextModelForTurn = useCallback(
    ({
      latestMessage,
      modelsWithKeys,
      contextMessages,
    }: {
      latestMessage: ArenaMessage;
      modelsWithKeys: Model[];
      contextMessages: ArenaMessage[];
    }): Model | null => {
      if (modelsWithKeys.length === 0) {
        return null;
      }

      const nonLatestSpeakerModels = modelsWithKeys.filter(
        (model) => model.id !== latestMessage.modelId,
      );
      const mentionCandidates =
        nonLatestSpeakerModels.length > 0
          ? nonLatestSpeakerModels
          : modelsWithKeys;

      const mentionedModel = findMentionedModelInText(
        latestMessage.content,
        mentionCandidates,
      );

      if (mentionedModel) {
        return mentionedModel;
      }

      const repliedToMessage = findMessageById(contextMessages, latestMessage.replyTo);
      if (repliedToMessage?.modelId) {
        const repliedModel = mentionCandidates.find(
          (model) => model.id === repliedToMessage.modelId,
        );

        if (repliedModel) {
          return repliedModel;
        }
      }

      const pool =
        nonLatestSpeakerModels.length > 0
          ? nonLatestSpeakerModels
          : modelsWithKeys;

      return [...pool].sort(
        (left, right) =>
          getLastModelMessageIndex(contextMessages, left.id) -
          getLastModelMessageIndex(contextMessages, right.id),
      )[0];
    },
    [],
  );

  const runAutoDiscussionTurns = useCallback(
    async ({
      runId,
      startMessage,
      modelsWithKeys,
      maxTurns,
    }: {
      runId: number;
      startMessage: ArenaMessage;
      modelsWithKeys: Model[];
      maxTurns: number;
    }) => {
      let previousMessage = startMessage;

      for (let turn = 0; turn < maxTurns; turn += 1) {
        if (openingRunIdRef.current !== runId) {
          return;
        }

        const contextMessages = [...messagesRef.current];
        const targetModel = selectNextModelForTurn({
          latestMessage: previousMessage,
          modelsWithKeys,
          contextMessages,
        });

        if (!targetModel) {
          return;
        }

        setStreaming(targetModel);

        try {
          const nextMessage = await requestModelResponse({
            targetModel,
            contextMessages,
            purpose: "reply",
            replyToMessageId: previousMessage.id,
          });

          if (openingRunIdRef.current !== runId) {
            return;
          }

          appendMessage(nextMessage);
          previousMessage = nextMessage;
        } catch (error) {
          if (isGenerationCancelledError(error)) {
            return;
          }

          const fallbackMessage: ArenaMessage = {
            id: createMessageId("m"),
            modelId: targetModel.id,
            senderType: "model",
            content:
              error instanceof Error
                ? `I hit an error: ${error.message}`
                : "I hit an error while generating a response.",
            mentions: [],
            replyTo: previousMessage.id,
            timestamp: timestampNow(),
          };

          appendMessage(fallbackMessage);
          previousMessage = fallbackMessage;
        }
      }
    },
    [appendMessage, requestModelResponse, selectNextModelForTurn],
  );

  const runOpeningTurns = useCallback(async () => {
    if (!topic.trim()) {
      return;
    }

    const runId = openingRunIdRef.current + 1;
    openingRunIdRef.current = runId;

    const modelsWithKeys = activeModels.filter((model) =>
      Boolean(apiKeys[model.id]?.trim()),
    );

    if (modelsWithKeys.length === 0) {
      replaceMessages([
        createSystemNotice(
          "Add at least one provider key in API Keys to start live responses.",
        ),
      ]);
      setStreaming(null);
      return;
    }

    replaceMessages([]);
    setReplyTo(null);
    let lastOpeningMessage: ArenaMessage | null = null;

    for (const model of modelsWithKeys) {
      if (openingRunIdRef.current !== runId) {
        break;
      }

      setStreaming(model);

      try {
        const modelMessage = await requestModelResponse({
          targetModel: model,
          contextMessages: messagesRef.current,
          purpose: "opening",
        });

        if (openingRunIdRef.current !== runId) {
          break;
        }

        appendMessage(modelMessage);
        lastOpeningMessage = modelMessage;
      } catch (error) {
        if (
          isGenerationCancelledError(error) ||
          openingRunIdRef.current !== runId
        ) {
          break;
        }

        const fallbackMessage: ArenaMessage = {
          id: createMessageId("m"),
          modelId: model.id,
          senderType: "model",
          content:
            error instanceof Error
              ? `I hit an error: ${error.message}`
              : "I hit an error while generating a response.",
          mentions: [],
          replyTo: null,
          timestamp: timestampNow(),
        };

        appendMessage(fallbackMessage);
        lastOpeningMessage = fallbackMessage;
      }
    }

    if (
      openingRunIdRef.current === runId &&
      lastOpeningMessage &&
      modelsWithKeys.length > 1
    ) {
      await runAutoDiscussionTurns({
        runId,
        startMessage: lastOpeningMessage,
        modelsWithKeys,
        maxTurns: Math.max(2, modelsWithKeys.length),
      });
    }

    if (openingRunIdRef.current === runId) {
      setStreaming(null);
    }
  }, [
    activeModels,
    apiKeys,
    appendMessage,
    replaceMessages,
    requestModelResponse,
    runAutoDiscussionTurns,
    topic,
  ]);

  useEffect(() => {
    if (
      pageMode !== "circle" ||
      !started ||
      hasBootstrappedConversationRef.current
    ) {
      return;
    }

    hasBootstrappedConversationRef.current = true;
    void enqueueGeneration(runOpeningTurns);
  }, [enqueueGeneration, pageMode, runOpeningTurns, started]);

  const handleStart = () => {
    if (!topic.trim() || selectedModels.length < 2) {
      return;
    }

    if (pageMode === "home") {
      const roomId = generateRandomId();
      const search = new URLSearchParams({
        topic,
        mode: selectedMode,
        models: selectedModels.join(","),
      });
      router.push(`/${roomId}/circle?${search.toString()}`);
      return;
    }

    setStarted(true);
    void enqueueGeneration(runOpeningTurns);
  };

  const handleSend = async () => {
    if (!composerVal.trim()) {
      return;
    }

    const userText = composerVal.trim();

    const userMessage: ArenaMessage = {
      id: createMessageId("u"),
      senderType: "user",
      content: userText,
      mentions: [],
      replyTo: replyTo?.id ?? null,
      timestamp: timestampNow(),
    };

    appendMessage(userMessage);
    setComposerVal("");
    setReplyTo(null);
    openingRunIdRef.current += 1;
    activeRequestAbortRef.current?.abort();

    const modelsWithKeysSnapshot = activeModels.filter((model) =>
      Boolean(apiKeys[model.id]?.trim()),
    );

    if (modelsWithKeysSnapshot.length === 0) {
      appendMessage(
        createSystemNotice("Add provider keys in API Keys before sending."),
      );
      return;
    }

    const runId = openingRunIdRef.current;

    void enqueueGeneration(async () => {
      await runAutoDiscussionTurns({
        runId,
        startMessage: userMessage,
        modelsWithKeys: modelsWithKeysSnapshot,
        maxTurns: resolveAutoTurnBudget(modelsWithKeysSnapshot.length),
      });
    });
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const mentionHint =
    activeModels.length > 0
      ? activeModels.map((model) => model.name).join(", @")
      : MODELS.map((model) => model.name).join(", @");

  return (
    <div
      className={`bg-app f-body text-body flex flex-col ${
        started ? "h-dvh overflow-hidden" : "min-h-screen"
      }`}
    >
      <ArenaHeader apiKeys={apiKeys} onOpenKeys={() => setShowKeys(true)} />

      <div
        className={`flex flex-1 min-h-0 ${
          started ? "overflow-hidden flex-col lg:flex-row" : "flex-col"
        }`}
      >
        {started && (
          <ArenaSidebar
            selectedModels={selectedModels}
            selectedMode={selectedMode}
            messages={messages}
            activeModels={activeModels}
            onToggleModel={toggleModel}
            onSelectMode={setSelectedMode}
          />
        )}

        <main
          className={`flex-1 flex flex-col min-w-0 ${
            started ? "min-h-0 overflow-hidden" : "overflow-y-auto"
          }`}
        >
          {!started ? (
            <LandingView
              selectedModels={selectedModels}
              selectedMode={selectedMode}
              topic={topic}
              isStartDisabled={!topic.trim() || selectedModels.length < 2}
              onToggleModel={toggleModel}
              onTopicChange={setTopic}
              onSelectMode={setSelectedMode}
              onStart={handleStart}
            />
          ) : (
            <ConversationView
              topic={topic}
              activeModels={activeModels}
              selectedMode={selectedMode}
              messages={messages}
              streaming={streaming}
              replyTo={replyTo}
              composerVal={composerVal}
              mentionHint={mentionHint}
              threadRef={threadRef}
              onSetReplyTo={setReplyTo}
              onComposerChange={setComposerVal}
              onComposerKeyDown={handleComposerKeyDown}
              onSend={() => {
                void handleSend();
              }}
            />
          )}
        </main>
      </div>

      {showKeys && (
        <ApiKeysModal
          onClose={() => setShowKeys(false)}
          keys={apiKeys}
          onSave={saveApiKeys}
        />
      )}
    </div>
  );
}
