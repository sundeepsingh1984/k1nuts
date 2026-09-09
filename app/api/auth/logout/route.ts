import { clearCustomerSession } from "../../../customer-auth";
import { getChatGPTUser } from "../../../chatgpt-auth";

export async function GET(request: Request) {
  const chatGPTUser = await getChatGPTUser();
  await clearCustomerSession();
  return Response.redirect(
    new URL(
      chatGPTUser ? "/signout-with-chatgpt?return_to=%2F" : "/",
      request.url,
    ),
    302,
  );
}
