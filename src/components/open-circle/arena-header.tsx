import Link from "next/link";

import { MODELS } from "@/lib/open-circle/constants";

import { ProviderDot } from "./provider-dot";

type ArenaHeaderProps = {
  apiKeys: Record<string, string>;
  onOpenKeys: () => void;
};

export function ArenaHeader({ apiKeys, onOpenKeys }: ArenaHeaderProps) {
  return (
    <header
      className="bg-app border-b border-header shrink-0 sticky top-0 z-50"
      style={{ height: 48 }}
    >
      <div className="h-full w-full max-w-[1380px] mx-auto px-3 sm:px-5 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-lg bg-violet-400"
            style={{ width: 22, height: 22 }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="#080809" />
              <circle cx="8" cy="2" r="1.5" fill="#080809" />
              <circle cx="8" cy="14" r="1.5" fill="#080809" />
              <circle cx="2" cy="8" r="1.5" fill="#080809" />
              <circle cx="14" cy="8" r="1.5" fill="#080809" />
            </svg>
          </div>
          <span
            className="f-display font-bold text-primary"
            style={{ fontSize: 19, letterSpacing: "-0.01em" }}
          >
            OpenCircle
          </span>
          <span className="hidden sm:inline f-mono text-[10px] text-hint border-l border-deep2 pl-2.5 ml-0.5">
            arena / v0.1
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {MODELS.map((model) => (
              <div key={model.id} className="flex items-center gap-1.5">
                <ProviderDot
                  color={model.color}
                  active={Boolean(apiKeys[model.id])}
                />
                <span className="hidden md:inline f-mono text-[10px] text-nav">
                  {model.provider}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onOpenKeys}
            className="bg-pill border border-deep2 rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-white/5 transition-colors"
            style={{ padding: "6px 12px" }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <rect
                x="3"
                y="7"
                width="10"
                height="7"
                rx="1.5"
                stroke="#4a4468"
                strokeWidth="1.2"
              />
              <path
                d="M5.5 7V5a2.5 2.5 0 015 0v2"
                stroke="#4a4468"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            <span className="f-body text-xs text-key">API Keys</span>
          </button>
        </div>
      </div>
    </header>
  );
}
