import type { Model } from "@/lib/open-circle/constants";

import { ModelBadge } from "./model-badge";

type StreamingIndicatorProps = {
  model: Model;
};

export function StreamingIndicator({ model }: StreamingIndicatorProps) {
  return (
    <div className="flex gap-3">
      <ModelBadge model={model} />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="f-mono text-[11px] font-medium" style={{ color: model.color }}>
            {model.name}
          </span>
          <span className="f-mono text-[10px] text-nav2">{model.provider}</span>
        </div>
        <div
          className="bg-bubble border border-dim px-3.5 py-2.5 flex items-center gap-1"
          style={{ borderLeft: `2px solid ${model.color}`, borderRadius: "2px 10px 10px 10px" }}
        >
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="inline-block w-1 h-1 rounded-full dot-pulse"
              style={{ background: `${model.color}88`, animationDelay: `${index * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
