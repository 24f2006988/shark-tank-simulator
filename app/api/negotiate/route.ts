import { runNegotiate } from "@/lib/handlers";
import { handle } from "@/lib/http";
import { negotiateRequestSchema } from "@/lib/schemas";

export async function POST(request: Request): Promise<Response> {
  return handle(request, "negotiate", negotiateRequestSchema, runNegotiate);
}
