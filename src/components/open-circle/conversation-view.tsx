import type { KeyboardEvent, MutableRefObject } from "react";

import {
  MODELS,
  type ArenaMessage,
  type Model,
  type Mode,
} from "@/lib/open-circle/constants";

import { MessageBubble } from "./message-bubble";
import { ModelBadge } from "./model-badge";
import { StreamingIndicator } from "./streaming-indicator";

type ConversationViewProps = {
  topic: string;
  activeModels: Model[];
  selectedMode: Mode;
  messages: ArenaMessage[];
  streaming: Model | null;
  replyTo: ArenaMessage | null;
  composerVal: string;
  mentionHint: string;
  threadRef: MutableRefObject<HTMLDivElement | null>;
  onSetReplyTo: (message: ArenaMessage | null) => void;
  onComposerChange: (value: string) => void;
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
};

export function ConversationView({
  topic,
  activeModels,
  selectedMode,
  messages,
  streaming,
  replyTo,
  composerVal,
  mentionHint,
  threadRef,
  onSetReplyTo,
  onComposerChange,
  onComposerKeyDown,
  onSend,
}: ConversationViewProps) {
  return (
    <>
      <div className="px-3 sm:px-6 py-3 border-b border-header flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 live-dot" />
        <span className="f-body text-[13px] text-topic-bar font-light truncate">
          {topic}
        </span>
        <div className="ml-auto flex gap-1.5 shrink-0">
          {activeModels.map((model) => (
            <ModelBadge key={model.id} model={model} />
          ))}
        </div>
        <span className="hidden sm:inline f-mono text-[10px] text-topic-bar border border-faint rounded-full px-2 py-0.5 shrink-0">
          {selectedMode}
        </span>
      </div>

      <div
        ref={threadRef}
        className="flex-1 overflow-y-auto px-3 sm:px-6 pt-6 pb-2"
      >
        <div className="flex flex-col gap-4">
          {messages.map((message) => {
            const replyMessage = message.replyTo
              ? (messages.find(
                  (candidate) => candidate.id === message.replyTo,
                ) ?? null)
              : null;

            return (
              <div
                key={message.id}
                className="msg-in cursor-default"
                onDoubleClick={() => onSetReplyTo(message)}
              >
                <MessageBubble
                  msg={message}
                  models={MODELS}
                  replyMsg={replyMessage}
                />
              </div>
            );
          })}
          {streaming && <StreamingIndicator model={streaming} />}
        </div>
      </div>

      <div className="px-3 sm:px-6 pb-5 pt-3 shrink-0">
        {replyTo && (
          <div
            className="flex items-center gap-2 mb-2 px-2.5 py-1.5 bg-surface border border-dim rounded-lg"
            style={{ borderLeft: "2px solid rgba(167,139,250,0.3)" }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 3L3 8l5 5M13 8H3"
                stroke="#4a4468"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="f-body text-[11px] text-key flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {replyTo.content.slice(0, 60)}...
            </span>
            <button
              type="button"
              onClick={() => onSetReplyTo(null)}
              className="bg-transparent border-none cursor-pointer text-muted text-xs p-0"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex gap-2 bg-surface border border-dim rounded-xl items-end px-3 py-2.5">
          <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-white/[0.03] border border-faint">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle
                cx="8"
                cy="5.5"
                r="2.5"
                stroke="#4a4468"
                strokeWidth="1.2"
              />
              <path
                d="M2.5 13c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5"
                stroke="#4a4468"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <textarea
            value={composerVal}
            onChange={(event) => onComposerChange(event.target.value)}
            onKeyDown={onComposerKeyDown}
            placeholder={`Message the arena... use @${mentionHint} to tag`}
            rows={1}
            className="flex-1 bg-transparent border-none text-body f-body text-[13px] resize-none font-light max-h-24 overflow-y-auto placeholder:text-ghost"
            style={{ lineHeight: 1.6 }}
          />
          <button
            type="button"
            onClick={onSend}
            className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center cursor-pointer transition-all hover-violet text-violet border"
            style={{
              background: "rgba(167,139,250,0.1)",
              borderColor: "rgba(167,139,250,0.25)",
              color: "#a78bfa",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8h12M8 2l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex justify-between mt-1.5 gap-2">
          <span className="hidden sm:inline f-mono text-[10px] text-rail">
            Enter to send · Shift+Enter for newline · Double-click to reply
          </span>
          {streaming && (
            <span
              className="f-mono text-[10px] text-violet"
              style={{ opacity: 0.5 }}
            >
              {streaming.name} is generating...
            </span>
          )}
        </div>
      </div>
    </>
  );
}
