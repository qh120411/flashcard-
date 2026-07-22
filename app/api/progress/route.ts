import { currentUser, database } from "../../auth-store";

const unauthorized = () => Response.json({ error: "Bạn cần đăng nhập để lưu tiến độ." }, { status: 401 });
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    const sql = await database();
    const [row] = await sql`SELECT ratings, history, start_date FROM wordly_progress WHERE user_id = ${user.id} LIMIT 1`;
    return Response.json({ user: { displayName: user.username, username: user.username }, progress: row ? { ratings: row.ratings, history: row.history, startDate: String(row.start_date).slice(0, 10) } : { ratings: {}, history: [], startDate: today() } });
  } catch {
    return Response.json({ error: "Database chưa được kết nối." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const payload = (await request.json()) as { ratings?: unknown; history?: unknown; startDate?: unknown };
  if (!payload.ratings || typeof payload.ratings !== "object" || !Array.isArray(payload.history) || typeof payload.startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(payload.startDate)) return Response.json({ error: "Dữ liệu tiến độ không hợp lệ." }, { status: 400 });
  const sql = await database();
  const ratings = JSON.stringify(payload.ratings).slice(0, 100_000);
  const history = JSON.stringify(payload.history.slice(0, 2000)).slice(0, 500_000);
  await sql`INSERT INTO wordly_progress (user_id, ratings, history, start_date) VALUES (${user.id}, ${ratings}::jsonb, ${history}::jsonb, ${payload.startDate}) ON CONFLICT (user_id) DO UPDATE SET ratings = EXCLUDED.ratings, history = EXCLUDED.history, start_date = EXCLUDED.start_date, updated_at = NOW()`;
  return Response.json({ saved: true });
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const sql = await database();
  await sql`DELETE FROM wordly_progress WHERE user_id = ${user.id}`;
  return Response.json({ deleted: true });
}
