import { useEffect, useState } from "react";

import { MODELS } from "@/lib/open-circle/constants";

import { ModelBadge } from "./model-badge";

type ApiKeyMap = Record<string, string>;

type ApiKeysModalProps = {
  onClose: () => void;
  keys: ApiKeyMap;
  onSave: (keys: ApiKeyMap) => void;
};

export function ApiKeysModal({ onClose, keys, onSave }: ApiKeysModalProps) {
  const [localKeys, setLocalKeys] = useState<ApiKeyMap>(keys);
  const [drafts, setDrafts] = useState<ApiKeyMap>(keys);
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalKeys(keys);
    setDrafts(keys);
  }, [keys]);

  const save = (modelId: string) => {
    const value = (drafts[modelId] ?? "").trim();
    const next = { ...localKeys, [modelId]: value };
    setLocalKeys(next);
    onSave(next);
    setEditing((previous) => ({ ...previous, [modelId]: false }));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center sm:justify-end pt-14 px-3 sm:pr-5"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-dim rounded-xl w-full max-w-96 overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-modal flex items-center justify-between">
          <div>
            <div className="f-display font-semibold text-lg text-primary">API Keys</div>
            <div className="f-body text-xs text-nav2 mt-0.5">Stored locally in your browser only</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-faint flex items-center justify-center text-key bg-transparent cursor-pointer hover:bg-white/5 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div>
          {MODELS.map((model, index) => {
            const hasKey = Boolean(localKeys[model.id]?.length > 4);
            const isEditing = Boolean(editing[model.id]);

            return (
              <div
                key={model.id}
                className={`px-5 py-3.5 ${index < MODELS.length - 1 ? "border-b border-app" : ""}`}
              >
                <div className={`flex items-center gap-2.5 ${isEditing ? "mb-2.5" : ""}`}>
                  <ModelBadge model={model} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="f-mono text-xs text-body font-medium">{model.name}</span>
                      <span
                        className="f-mono text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: hasKey ? "#a78bfa14" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${hasKey ? "#a78bfa30" : "rgba(255,255,255,0.06)"}`,
                          color: hasKey ? "#a78bfa" : "#38344c",
                        }}
                      >
                        {hasKey ? "ready" : "no key"}
                      </span>
                    </div>
                    <div className="f-mono text-[10px] text-dim mt-0.5">{model.keyLabel}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing((previous) => ({ ...previous, [model.id]: !isEditing }))
                    }
                    className="f-body text-[11px] text-key border border-faint rounded-md px-2.5 py-1 bg-transparent cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    {isEditing ? "cancel" : hasKey ? "edit" : "add"}
                  </button>
                </div>

                {isEditing && (
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={visible[model.id] ? "text" : "password"}
                        value={drafts[model.id] ?? ""}
                        onChange={(event) =>
                          setDrafts((previous) => ({ ...previous, [model.id]: event.target.value }))
                        }
                        placeholder="sk-..."
                        className="w-full bg-input border border-dim rounded-md py-2 pl-2.5 pr-8 text-body f-mono text-[11px] box-border"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setVisible((previous) => ({ ...previous, [model.id]: !previous[model.id] }))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-key p-0"
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                          {visible[model.id] ? (
                            <>
                              <path
                                d="M10 4C5.5 4 2 10 2 10s3.5 6 8 6 8-6 8-6-3.5-6-8-6z"
                                stroke="currentColor"
                                strokeWidth="1.4"
                              />
                              <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.4" />
                            </>
                          ) : (
                            <path
                              d="M3 3l14 14M10 4C5.5 4 2 10 2 10s3.5 6 8 6 8-6 8-6"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              strokeLinecap="round"
                            />
                          )}
                        </svg>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => save(model.id)}
                      className="f-body text-[11px] font-medium rounded-md px-3 py-2 whitespace-nowrap cursor-pointer"
                      style={{
                        background: `${model.color}18`,
                        border: `1px solid ${model.color}38`,
                        color: model.color,
                      }}
                    >
                      save
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-app flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="6" width="10" height="8" rx="1.5" stroke="#2e2a48" strokeWidth="1.2" />
            <path
              d="M5.5 6V4.5a2.5 2.5 0 015 0V6"
              stroke="#2e2a48"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          <span className="f-body text-[11px] text-dim">Keys never leave your browser. No account required.</span>
        </div>
      </div>
    </div>
  );
}
