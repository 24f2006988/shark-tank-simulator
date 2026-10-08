import { runTurn } from "@/lib/handlers";
import { handle } from "@/lib/http";
import { turnRequestSchema } from "@/lib/schemas";

export async function POST(request: Request): Promise<Response> {
  return handle(request, "turn", turnRequestSchema, runTurn);
}
