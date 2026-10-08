import { runDebrief } from "@/lib/handlers";
import { handle } from "@/lib/http";
import { debriefRequestSchema } from "@/lib/schemas";

export async function POST(request: Request): Promise<Response> {
  return handle(request, "debrief", debriefRequestSchema, runDebrief);
}
