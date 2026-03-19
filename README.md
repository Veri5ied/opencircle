# OpenCircle

Multi-LLM conversations you can join.

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. (Optional) create local env file from template:

```bash
cp .env.example .env.local
```

3. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

`.env.example` includes the provider keys users can add:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`

For MVP, OpenCircle is BYOK-first and users can add keys directly in the in-app **API Keys** modal.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query
- Vercel AI SDK (`ai`, provider SDKs)

## Routes

- `/` home
- `/:room-id/circle` arena

## Deploy

Deploy with Vercel or any Next.js-compatible host.

When sharing with users, point them to `.env.example` for supported key names.
