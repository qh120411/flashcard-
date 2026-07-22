import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { userProgress } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

const unauthorized = () => Response.json({ error: "Bạn cần đăng nhập để lưu tiến độ." }, { status: 401 });
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return unauthorized();
  const [row] = await getDb().select().from(userProgress).where(eq(userProgress.userEmail, user.email)).limit(1);
  return Response.json({ user, progress: row ? { ratings: JSON.parse(row.ratings), history: JSON.parse(row.history), startDate: row.startDate } : { ratings: {}, history: [], startDate: today() } });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return unauthorized();
  const payload = (await request.json()) as { ratings?: unknown; history?: unknown; startDate?: unknown };
  if (!payload.ratings || typeof payload.ratings !== "object" || !Array.isArray(payload.history) || typeof payload.startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(payload.startDate)) return Response.json({ error: "Dữ liệu tiến độ không hợp lệ." }, { status: 400 });
  const ratings = JSON.stringify(payload.ratings).slice(0, 100_000);
  const history = JSON.stringify(payload.history.slice(0, 2000)).slice(0, 500_000);
  await getDb().insert(userProgress).values({ userEmail: user.email, ratings, history, startDate: payload.startDate }).onConflictDoUpdate({ target: userProgress.userEmail, set: { ratings, history, startDate: payload.startDate, updatedAt: new Date().toISOString() } });
  return Response.json({ saved: true });
}

export async function DELETE() {
  const user = await getChatGPTUser();
  if (!user) return unauthorized();
  await getDb().delete(userProgress).where(eq(userProgress.userEmail, user.email));
  return Response.json({ deleted: true });
}
