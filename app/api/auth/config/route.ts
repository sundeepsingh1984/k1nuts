import { getCustomerAuthConfiguration } from "../../../customer-auth";

export async function GET() {
  return Response.json(await getCustomerAuthConfiguration(), {
    headers: { "cache-control": "private, no-store" },
  });
}
