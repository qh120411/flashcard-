import { clearSession } from "../../../auth-store";
export async function POST() {
  await clearSession();
  return Response.json({ signedOut: true });
}
