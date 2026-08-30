import { getChatGPTUser } from "../../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
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
