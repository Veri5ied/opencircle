import { MODES, MODELS, type Mode } from "@/lib/open-circle/constants";

import { ModelBadge } from "./model-badge";

type LandingViewProps = {
  selectedModels: string[];
  selectedMode: Mode;
  topic: string;
  isStartDisabled: boolean;
  onToggleModel: (modelId: string) => void;
  onTopicChange: (topic: string) => void;
  onSelectMode: (mode: Mode) => void;
  onStart: () => void;
};

export function LandingView({
  selectedModels,
  selectedMode,
  topic,
  isStartDisabled,
  onToggleModel,
  onTopicChange,
  onSelectMode,
  onStart,
}: LandingViewProps) {
  return (
    <div className="flex flex-1 min-h-0 justify-center">
      <div className="w-full max-w-[1380px] flex flex-col lg:flex-row">
        <div className="flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-deep relative overflow-hidden px-5 sm:px-8 lg:px-12 pt-10 sm:pt-12 lg:pt-14 pb-8 lg:pb-12 lg:basis-[55%] lg:shrink-0">
        <svg
          className="absolute top-0 right-0 pointer-events-none"
          width="520"
          height="520"
          viewBox="0 0 520 520"
          fill="none"
          style={{ opacity: 0.04 }}
        >
          <circle
            cx="400"
            cy="120"
            r="300"
            stroke="#a78bfa"
            strokeWidth="0.6"
          />
          <circle
            cx="400"
            cy="120"
            r="220"
            stroke="#a78bfa"
            strokeWidth="0.6"
          />
          <circle
            cx="400"
            cy="120"
            r="140"
            stroke="#a78bfa"
            strokeWidth="0.6"
          />
          <circle cx="400" cy="120" r="60" stroke="#a78bfa" strokeWidth="0.6" />
          <line
            x1="100"
            y1="120"
            x2="700"
            y2="120"
            stroke="#a78bfa"
            strokeWidth="0.4"
          />
          <line
            x1="400"
            y1="-180"
            x2="400"
            y2="420"
            stroke="#a78bfa"
            strokeWidth="0.4"
          />
          <line
            x1="188"
            y1="-88"
            x2="612"
            y2="328"
            stroke="#a78bfa"
            strokeWidth="0.4"
          />
          <line
            x1="612"
            y1="-88"
            x2="188"
            y2="328"
            stroke="#a78bfa"
            strokeWidth="0.4"
          />
        </svg>

        <div>
          <div
            className="inline-flex items-center gap-1.5 border rounded-full px-3 py-1 mb-9"
            style={{ borderColor: "#1c1c22" }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 breathe" />
            <span className="f-mono text-[11px] text-arena-lbl">
              arena ready
            </span>
          </div>

          <h1 className="f-display font-semibold text-primary mb-7 text-[50px] sm:text-[64px] lg:text-[72px] leading-[0.95] tracking-[-0.025em]">
            Open
            <br />
            the
            <br />
            <span
              style={{ color: "transparent", WebkitTextStroke: "1px #a78bfa" }}
            >
              circle.
            </span>
          </h1>

          <p
            className="f-body text-sm text-faint font-light max-w-sm"
            style={{ lineHeight: 1.7 }}
          >
            Multiple models. One shared thread.
            <br />
            Debate, diverge, and converge in real time.
          </p>
        </div>

        <div>
          <div
            className="f-mono text-[10px] text-ghost uppercase mb-4"
            style={{ letterSpacing: "0.14em" }}
          >
            PARTICIPANTS IN THIS ROOM
          </div>
          <div className="flex flex-col gap-2">
            {MODELS.map((model) => {
              const selected = selectedModels.includes(model.id);
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => onToggleModel(model.id)}
                  className="flex items-center gap-3.5 rounded-xl cursor-pointer text-left transition-all"
                  style={{
                    padding: "12px 14px",
                    background: selected ? `${model.color}08` : "transparent",
                    border: `1px solid ${selected ? `${model.color}30` : "#111116"}`,
                  }}
                >
                  <ModelBadge model={model} size="md" />
                  <div className="flex-1">
                    <div
                      className="f-mono text-[13px] font-medium"
                      style={{ color: selected ? model.color : "#3a3a4a" }}
                    >
                      {model.name}
                    </div>
                    <div className="f-body text-[11px] text-ghost mt-0.5">
                      {model.provider}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block transition-all"
                      style={{
                        background: selected ? model.color : "#1e1e28",
                        boxShadow: selected
                          ? `0 0 0 3px ${model.color}20`
                          : "none",
                      }}
                    />
                    <span
                      className="f-mono text-[10px]"
                      style={{
                        color: selected ? `${model.color}99` : "#252430",
                      }}
                    >
                      {selected ? "in room" : "add"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-5 sm:px-8 lg:px-10 py-8 lg:py-12">
          <div className="w-full" style={{ maxWidth: 400 }}>
          <div className="mb-7">
            <div
              className="f-mono text-[10px] text-ghost uppercase mb-3"
              style={{ letterSpacing: "0.14em" }}
            >
              TOPIC
            </div>
            <textarea
              value={topic}
              onChange={(event) => onTopicChange(event.target.value)}
              placeholder="What should they discuss?"
              rows={5}
              className="w-full bg-transparent border-0 f-display font-normal text-primary resize-none placeholder:text-ghost transition-colors"
              style={{
                fontSize: 22,
                lineHeight: 1.45,
                paddingBottom: 14,
                borderBottom: `1px solid ${topic.trim() ? "rgba(167,139,250,0.25)" : "#1a1a22"}`,
              }}
            />
          </div>

          <div className="mb-9">
            <div
              className="f-mono text-[10px] text-ghost uppercase mb-3"
              style={{ letterSpacing: "0.14em" }}
            >
              MODE
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSelectMode(mode)}
                  className="rounded-full f-body text-xs font-normal cursor-pointer transition-all"
                  style={{
                    padding: "5px 14px",
                    border: `1px solid ${selectedMode === mode ? "rgba(167,139,250,0.4)" : "#181820"}`,
                    background:
                      selectedMode === mode
                        ? "rgba(167,139,250,0.08)"
                        : "transparent",
                    color: selectedMode === mode ? "#a78bfa" : "#2e2c3c",
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onStart}
            disabled={isStartDisabled}
            className="w-full bg-violet-400 border-none rounded-xl text-black f-body font-semibold text-sm cursor-pointer hover:bg-violet-300 transition-colors flex items-center justify-center gap-2.5 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ padding: "15px 0" }}
          >
            Open the Arena
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2 mt-5">
            <div className="flex-1 h-px" style={{ background: "#111116" }} />
            <span className="f-body text-[11px] text-hint">
              {selectedModels.length} of {MODELS.length} models selected
            </span>
            <div className="flex-1 h-px" style={{ background: "#111116" }} />
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
