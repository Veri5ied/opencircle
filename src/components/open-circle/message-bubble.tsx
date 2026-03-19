import type { ArenaMessage, Model } from "@/lib/open-circle/constants";

import { MentionText } from "./mention-text";
import { ModelBadge } from "./model-badge";

type MessageBubbleProps = {
  msg: ArenaMessage;
  models: Model[];
  replyMsg: ArenaMessage | null;
};

export function MessageBubble({ msg, models, replyMsg }: MessageBubbleProps) {
  const model = models.find((item) => item.id === msg.modelId);
  const isUser = msg.senderType === "user";
  const replyModel = replyMsg
    ? models.find((item) => item.id === replyMsg.modelId)
    : null;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && model && <ModelBadge model={model} />}

      {isUser && (
        <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-white/5 border border-faint">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5.5" r="2.5" stroke="#4a4468" strokeWidth="1.2" />
            <path
              d="M2.5 13c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5"
              stroke="#4a4468"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      <div className="max-w-[85%] sm:max-w-[72%] min-w-0">
        {!isUser && model && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="f-mono text-[11px] font-medium" style={{ color: model.color }}>
              {model.name}
            </span>
            <span className="f-mono text-[10px] text-nav2">{model.provider}</span>
            <span className="f-mono text-[10px] text-dim">{msg.timestamp}</span>
          </div>
        )}

        {replyMsg && (
          <div
            className="pl-2 mb-1.5 text-xs text-muted italic leading-snug overflow-hidden"
            style={{
              borderLeft: `2px solid ${isUser ? "#ffffff18" : `${replyModel?.color ?? "#4a4468"}50`}`,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {replyMsg.content.slice(0, 90)}…
          </div>
        )}

        <div
          className="bg-bubble px-3.5 py-2.5 border border-dim"
          style={
            !isUser && model
              ? {
                  borderLeft: `2px solid ${model.color}`,
                  borderRadius: "2px 10px 10px 10px",
                }
              : {
                  borderRadius: isUser
                    ? "10px 4px 10px 10px"
                    : "4px 10px 10px 10px",
                }
          }
        >
          <p
            className="m-0 text-sm leading-relaxed f-body font-light"
            style={{ color: isUser ? "#b8b4d0" : "#9e9ab8" }}
          >
            <MentionText text={msg.content} models={models} />
          </p>
        </div>

        {isUser && <div className="text-right mt-1 f-mono text-[10px] text-dim">{msg.timestamp}</div>}
      </div>
    </div>
  );
}
