import {
  MODES,
  MODELS,
  type ArenaMessage,
  type Mode,
  type Model,
} from "@/lib/open-circle/constants";

import { ModelBadge } from "./model-badge";

type ArenaSidebarProps = {
  selectedModels: string[];
  selectedMode: Mode;
  messages: ArenaMessage[];
  activeModels: Model[];
  onToggleModel: (modelId: string) => void;
  onSelectMode: (mode: Mode) => void;
};

export function ArenaSidebar({
  selectedModels,
  selectedMode,
  messages,
  activeModels,
  onToggleModel,
  onSelectMode,
}: ArenaSidebarProps) {
  return (
    <aside className="w-full lg:w-[220px] shrink-0 flex flex-col overflow-y-auto border-b lg:border-b-0 lg:border-r border-app py-4 lg:py-5 max-h-[38vh] lg:max-h-none lg:h-full">
      <div className="px-4 pb-4 border-b border-row">
        <div className="f-mono text-[10px] text-dim uppercase tracking-widest mb-2.5">
          Participants
        </div>
        {MODELS.map((model) => {
          const selected = selectedModels.includes(model.id);

          return (
            <button
              key={model.id}
              type="button"
              onClick={() => onToggleModel(model.id)}
              className="w-full flex items-center gap-2.5 rounded-lg mb-1 cursor-pointer text-left transition-all"
              style={{
                padding: "7px 8px",
                background: selected ? `${model.color}0c` : "transparent",
                border: `1px solid ${selected ? `${model.color}28` : "transparent"}`,
              }}
            >
              <ModelBadge model={model} />
              <div className="flex-1 min-w-0">
                <div
                  className="f-mono text-xs font-medium"
                  style={{ color: selected ? model.color : "#4a4468" }}
                >
                  {model.name}
                </div>
                <div className="f-body text-[10px] text-dim">
                  {model.provider}
                </div>
              </div>
              {selected && (
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: model.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-4">
        <div className="f-mono text-[10px] text-dim uppercase tracking-widest mb-2.5">
          Mode
        </div>
        {MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onSelectMode(mode)}
            className="w-full flex items-center rounded-md mb-0.5 cursor-pointer text-left transition-all"
            style={{
              padding: "6px 8px",
              background: selectedMode === mode ? "#a78bfa0c" : "transparent",
              border: `1px solid ${selectedMode === mode ? "#a78bfa28" : "transparent"}`,
            }}
          >
            <span
              className={`f-body text-xs ${selectedMode === mode ? "font-medium" : "font-normal"}`}
              style={{ color: selectedMode === mode ? "#a78bfa" : "#38344c" }}
            >
              {mode}
            </span>
          </button>
        ))}
      </div>

      {messages.length > 0 && (
        <div className="px-4 pt-5 mt-auto">
          <div className="f-mono text-[10px] text-dim uppercase tracking-widest mb-2">
            Activity
          </div>
          {activeModels.map((model) => {
            const count = messages.filter(
              (message) => message.modelId === model.id,
            ).length;

            return (
              <div key={model.id} className="flex items-center gap-2 mb-1.5">
                <div
                  className="f-mono text-[10px] w-7"
                  style={{ color: model.color }}
                >
                  {model.shortCode}
                </div>
                <div
                  className="flex-1 rounded-sm overflow-hidden"
                  style={{ height: 3, background: "#0f0d1c" }}
                >
                  <div
                    className="h-full rounded-sm transition-all duration-500"
                    style={{
                      width: `${Math.min(100, count * 25)}%`,
                      background: `${model.color}60`,
                    }}
                  />
                </div>
                <div className="f-mono text-[10px] text-dim w-3.5 text-right">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
