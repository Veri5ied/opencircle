import type { Model } from "@/lib/open-circle/constants";

type MentionTextProps = {
  text: string;
  models: Model[];
};

export function MentionText({ text, models }: MentionTextProps) {
  return (
    <>
      {text.split(/(@\w+)/g).map((part, index) => {
        const match = models.find(
          (model) =>
            part.toLowerCase() === `@${model.name.toLowerCase()}` ||
            part.toLowerCase() === `@${model.id.toLowerCase()}`,
        );

        return match ? (
          <span
            key={`${part}-${index}`}
            className="f-mono text-[0.85em] rounded px-1"
            style={{ color: match.color, background: `${match.color}18` }}
          >
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        );
      })}
    </>
  );
}
