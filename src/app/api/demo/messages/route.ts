import { DEMO_MESSAGES } from "@/lib/open-circle/constants";

export async function GET() {
  return Response.json({ messages: DEMO_MESSAGES });
}
