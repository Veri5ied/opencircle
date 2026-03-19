import type { Model } from "@/lib/open-circle/constants";

type ModelBadgeProps = {
  model: Model;
  size?: "sm" | "md";
};

export function ModelBadge({ model, size = "sm" }: ModelBadgeProps) {
  const cls = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-[13px]";

  return (
    <div
      className={`${cls} rounded-lg flex items-center justify-center shrink-0 f-mono font-medium`}
      style={{
        background: `${model.color}18`,
        border: `1px solid ${model.color}44`,
        color: model.color,
      }}
    >
      {model.shortCode}
    </div>
  );
}
