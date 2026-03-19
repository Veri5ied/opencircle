"use client";

import { useQuery } from "@tanstack/react-query";
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
  DEMO_MESSAGES,
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

export function OpenCircleApp({
  pageMode,
  initialTopic,
  initialMode,
  initialSelectedModels,
}: OpenCircleAppProps) {
  const router = useRouter();
  const threadRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const hasBootstrappedConversationRef = useRef(false);

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
    initialSelectedModels && initialSelectedModels.length >= 2
      ? initialSelectedModels
      : ["gpt4o", "claude"],
  );
  const [selectedMode, setSelectedMode] = useState<Mode>(initialMode ?? "Free discussion");
  const [topic, setTopic] = useState(initialTopic ?? "");
  const [started, setStarted] = useState(pageMode === "circle");
  const [messages, setMessages] = useState<ArenaMessage[]>([]);
  const [composerVal, setComposerVal] = useState("");
  const [streaming, setStreaming] = useState<Model | null>(null);
  const [replyTo, setReplyTo] = useState<ArenaMessage | null>(null);

  const activeModels = useMemo(
    () => MODELS.filter((model) => selectedModels.includes(model.id)),
    [selectedModels],
  );

  const demoMessagesQuery = useQuery({
    queryKey: ["demo-messages"],
    queryFn: async () => {
      const response = await fetch("/api/demo/messages", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("failed to load demo messages");
      }
      const json = (await response.json()) as { messages: ArenaMessage[] };
      return json.messages;
    },
  });

  const demoMessages = demoMessagesQuery.data ?? DEMO_MESSAGES;

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
    setStarted(pageMode === "circle");
  }, [pageMode]);

  useEffect(() => {
    hasBootstrappedConversationRef.current = false;
  }, [pageMode]);

  useEffect(() => {
    if (pageMode === "circle") {
      setTopic(initialTopic ?? "");
      setSelectedMode(initialMode ?? "Free discussion");
      setSelectedModels(
        initialSelectedModels && initialSelectedModels.length >= 2
          ? initialSelectedModels
          : ["gpt4o", "claude"],
      );
    }
  }, [initialMode, initialSelectedModels, initialTopic, pageMode]);

  useEffect(
    () => () => {
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timersRef.current = [];
    },
    [],
  );

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timerId = window.setTimeout(callback, delay);
    timersRef.current.push(timerId);
  }, []);

  const playDemoConversation = useCallback(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];

    setMessages([]);
    setStreaming(null);

    let index = 0;

    const next = () => {
      if (index >= demoMessages.length) {
        return;
      }

      const msg = demoMessages[index];
      const model = MODELS.find((item) => item.id === msg.modelId);

      if (model) {
        setStreaming(model);
        schedule(() => {
          setStreaming(null);
          setMessages((previous) => [...previous, msg]);
          index += 1;
          if (index < demoMessages.length) {
            schedule(next, 900);
          }
        }, 1200 + Math.random() * 800);
      } else {
        setMessages((previous) => [...previous, msg]);
        index += 1;
        if (index < demoMessages.length) {
          schedule(next, 500);
        }
      }
    };

    schedule(next, 400);
  }, [demoMessages, schedule]);

  useEffect(() => {
    if (pageMode !== "circle" || hasBootstrappedConversationRef.current) {
      return;
    }

    hasBootstrappedConversationRef.current = true;

    const timerId = window.setTimeout(() => {
      playDemoConversation();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [pageMode, playDemoConversation]);

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
    playDemoConversation();
  };

  const handleSend = () => {
    if (!composerVal.trim()) {
      return;
    }

    const userMsg: ArenaMessage = {
      id: `u-${Date.now()}`,
      senderType: "user",
      content: composerVal,
      mentions: [],
      replyTo: replyTo?.id ?? null,
      timestamp: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((previous) => [...previous, userMsg]);
    setComposerVal("");
    setReplyTo(null);

    const sourceModels = activeModels.length > 0 ? activeModels : MODELS;
    const hit = sourceModels.find(
      (model) =>
        userMsg.content.toLowerCase().includes(`@${model.name.toLowerCase()}`) ||
        userMsg.content.toLowerCase().includes(`@${model.id.toLowerCase()}`),
    );

    const responder = hit ?? sourceModels[Math.floor(Math.random() * sourceModels.length)];

    schedule(() => {
      setStreaming(responder);
      schedule(() => {
        setStreaming(null);
        setMessages((previous) => [
          ...previous,
          {
            id: `r-${Date.now()}`,
            modelId: responder.id,
            senderType: "model",
            content:
              "That's a genuinely interesting framing. The interaction between interpretability and governance legibility deserves more attention — most treatments separate them when they're deeply entangled.",
            mentions: [],
            replyTo: userMsg.id,
            timestamp: new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }, 1600);
    }, 600);
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
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
              onSend={handleSend}
            />
          )}
        </main>
      </div>

      {showKeys && <ApiKeysModal onClose={() => setShowKeys(false)} keys={apiKeys} onSave={saveApiKeys} />}
    </div>
  );
}
