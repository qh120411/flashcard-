import { hash } from "bcryptjs";
import { createSession, database, randomUUID } from "../../../auth-store";

export async function POST(request: Request) {
  try {
    const { username: raw, password, confirmPassword } = await request.json() as Record<string, string>;
    const username = raw?.trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,32}$/.test(username ?? "")) return Response.json({ error: "Tài khoản cần 3–32 ký tự: chữ, số, dấu chấm, gạch ngang hoặc gạch dưới." }, { status: 400 });
    if (typeof password !== "string" || password.length < 6 || password.length > 72) return Response.json({ error: "Mật khẩu cần từ 6 đến 72 ký tự." }, { status: 400 });
    if (password !== confirmPassword) return Response.json({ error: "Hai mật khẩu chưa giống nhau." }, { status: 400 });
    const sql = await database();
    const existing = await sql`SELECT 1 FROM wordly_users WHERE username = ${username} LIMIT 1`;
    if (existing.length) return Response.json({ error: "Tên tài khoản đã được sử dụng." }, { status: 409 });
    const id = randomUUID();
    const passwordHash = await hash(password, 12);
    await sql`INSERT INTO wordly_users (id, username, password_hash) VALUES (${id}, ${username}, ${passwordHash})`;
    await createSession(id);
    return Response.json({ user: { username } }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "REGISTER_FAILED";
    console.error("WORDLY_REGISTER", error);
    return Response.json({ error: code === "DATABASE_URL_MISSING" ? "Database chưa được kết nối." : "Không thể đăng ký lúc này.", code }, { status: 500 });
  }
}
