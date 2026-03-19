import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import type { Model } from "@/lib/open-circle/constants";

type MessageMarkdownProps = {
  text: string;
  models: Model[];
};

type MarkdownNode = {
  type?: string;
  value?: string;
  url?: string;
  children?: MarkdownNode[];
};

function findMentionedModel(token: string, models: Model[]): Model | null {
  const normalizedToken = token.toLowerCase();

  return (
    models.find(
      (model) =>
        normalizedToken === model.id.toLowerCase() ||
        normalizedToken === model.name.toLowerCase(),
    ) ?? null
  );
}

function transformTextWithMentions(
  text: string,
  models: Model[],
): MarkdownNode[] {
  const mentionPattern = /@([a-z0-9-]+)/gi;
  const nodes: MarkdownNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(mentionPattern)) {
    const start = match.index ?? -1;
    if (start < 0) {
      continue;
    }

    const token = match[1] ?? "";
    const fullMatch = match[0] ?? "";
    const end = start + fullMatch.length;
    const previousChar = start > 0 ? text[start - 1] : "";
    const nextChar = text[end] ?? "";
    const hasWordCharBefore = Boolean(
      previousChar && /[a-z0-9_]/i.test(previousChar),
    );
    const hasWordCharAfter = Boolean(nextChar && /[a-z0-9_-]/i.test(nextChar));
    const model = findMentionedModel(token, models);

    if (hasWordCharBefore || hasWordCharAfter || !model) {
      continue;
    }

    if (start > cursor) {
      nodes.push({
        type: "text",
        value: text.slice(cursor, start),
      });
    }

    nodes.push({
      type: "link",
      url: `#mention-${model.id}`,
      children: [{ type: "text", value: fullMatch }],
    });

    cursor = end;
  }

  if (cursor < text.length) {
    nodes.push({
      type: "text",
      value: text.slice(cursor),
    });
  }

  if (nodes.length === 0) {
    return [{ type: "text", value: text }];
  }

  return nodes;
}

function remarkMentions(models: Model[]) {
  return (tree: MarkdownNode) => {
    const visit = (node: MarkdownNode) => {
      if (!node.children || node.children.length === 0) {
        return;
      }

      if (
        node.type === "code" ||
        node.type === "inlineCode" ||
        node.type === "link" ||
        node.type === "definition"
      ) {
        return;
      }

      const nextChildren: MarkdownNode[] = [];

      for (const child of node.children) {
        if (child.type === "text") {
          nextChildren.push(
            ...transformTextWithMentions(child.value ?? "", models),
          );
          continue;
        }

        if ("children" in child) {
          visit(child);
        }

        nextChildren.push(child);
      }

      node.children = nextChildren;
    };

    visit(tree);
  };
}

function createComponents(models: Model[]): Components {
  return {
    p: ({ children }) => <p className="m-0 mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => (
      <ul className="my-2 list-disc pl-5 space-y-1 marker:text-[#5e5784]">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="my-2 list-decimal pl-5 space-y-1 marker:text-[#5e5784]">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-2 border-l-2 border-[#2a2442] pl-3 text-[#8d89a9] italic">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-2 border-0 border-t border-[#1a1730]" />,
    pre: ({ children }) => (
      <pre className="my-2 overflow-x-auto rounded-md border border-faint bg-[#080618] px-3 py-2">
        {children}
      </pre>
    ),
    code: ({ children, className }) => {
      const isBlock = Boolean(className);

      return (
        <code
          className={`f-mono text-[12px] ${
            isBlock
              ? ""
              : "rounded-sm border border-faint bg-white/5 px-1 py-0.5"
          }`}
        >
          {children}
        </code>
      );
    },
    a: ({ href, children }) => {
      const hrefValue = typeof href === "string" ? href : "";

      if (hrefValue.startsWith("#mention-")) {
        const mentionId = hrefValue.replace("#mention-", "");
        const mentionModel = models.find((model) => model.id === mentionId);
        const mentionColor = mentionModel?.color ?? "#a78bfa";

        return (
          <span
            className="f-mono text-[0.85em] rounded px-1"
            style={{
              color: mentionColor,
              background: `${mentionColor}18`,
            }}
          >
            {children}
          </span>
        );
      }

      return (
        <a
          href={hrefValue}
          target="_blank"
          rel="noreferrer"
          className="text-violet underline decoration-[#a78bfa55] underline-offset-2"
        >
          {children}
        </a>
      );
    },
    table: ({ children }) => (
      <div className="my-2 overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-faint bg-white/5 px-2 py-1 font-medium">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-faint px-2 py-1">{children}</td>
    ),
  };
}

export function MessageMarkdown({ text, models }: MessageMarkdownProps) {
  return (
    <div className="f-body text-sm leading-relaxed break-words">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm, [remarkMentions as never, models]]}
        rehypePlugins={[rehypeSanitize]}
        components={createComponents(models)}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
