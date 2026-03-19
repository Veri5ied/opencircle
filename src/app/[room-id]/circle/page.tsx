import { OpenCircleApp } from "@/components/open-circle/open-circle-app";
import { MODES, type Mode } from "@/lib/open-circle/constants";

type CirclePageProps = {
  searchParams: Promise<{
    topic?: string;
    mode?: string;
    models?: string;
  }>;
};

function parseMode(mode?: string): Mode {
  if (!mode) {
    return "Free discussion";
  }

  const matchedMode = MODES.find(
    (candidate) => candidate.toLowerCase() === mode.toLowerCase(),
  );

  return matchedMode ?? "Free discussion";
}

function parseModels(models?: string): string[] {
  if (!models) {
    return ["gpt4o", "claude"];
  }

  const parsed = models
    .split(",")
    .map((model) => model.trim().toLowerCase())
    .filter(Boolean);

  return parsed.length >= 2 ? parsed : ["gpt4o", "claude"];
}

export default async function Page({ searchParams }: CirclePageProps) {
  const query = await searchParams;

  return (
    <OpenCircleApp
      pageMode="circle"
      initialTopic={query.topic ?? ""}
      initialMode={parseMode(query.mode)}
      initialSelectedModels={parseModels(query.models)}
    />
  );
}
