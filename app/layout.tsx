import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  return {
    title: "Wordly - Flashcard IELTS dễ nhớ",
    description: "Học từ IELTS từ Academic Word List với nghĩa Việt, họ từ, ví dụ và lịch sử ôn riêng theo tài khoản.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title: "Wordly", description: "Học vừa đủ, nhớ thật lâu.", images: [image] },
    twitter: { card: "summary_large_image", title: "Wordly", description: "Học vừa đủ, nhớ thật lâu.", images: [image] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
