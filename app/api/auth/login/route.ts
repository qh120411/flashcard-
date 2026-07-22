import bcrypt from "bcryptjs";
import { createSession, database } from "../../../auth-store";

export async function POST(request: Request) {
  try {
    const { username: raw, password } = await request.json() as Record<string, string>;
    const username = raw?.trim().toLowerCase();
    const sql = await database();
    const [user] = await sql`SELECT id, username, password_hash FROM wordly_users WHERE username = ${username ?? ""} LIMIT 1`;
    if (!user || typeof password !== "string" || !(await bcrypt.compare(password, String(user.password_hash)))) return Response.json({ error: "Sai tài khoản hoặc mật khẩu." }, { status: 401 });
    await createSession(String(user.id));
    return Response.json({ user: { username: String(user.username) } });
  } catch (error) {
    return Response.json({ error: error instanceof Error && error.message === "DATABASE_URL_MISSING" ? "Database chưa được kết nối." : "Không thể đăng nhập lúc này." }, { status: 500 });
  }
}
