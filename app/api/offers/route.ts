import { runOffers } from "@/lib/handlers";
import { handle } from "@/lib/http";
import { offersRequestSchema } from "@/lib/schemas";

export async function POST(request: Request): Promise<Response> {
  return handle(request, "offers", offersRequestSchema, runOffers);
}
