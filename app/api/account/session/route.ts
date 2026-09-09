import { getCustomerUser } from "../../../customer-auth";

export async function GET() {
  const user = await getCustomerUser();
  return Response.json(
    user
      ? {
          signedIn: true,
          user: {
            displayName: user.displayName,
            email: user.email,
          },
        }
      : { signedIn: false, user: null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
