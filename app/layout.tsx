import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wordly - Flashcard IELTS dễ nhớ",
  description: "Học từ IELTS từ Academic Word List với nghĩa Việt, họ từ, ví dụ và lịch sử ôn.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

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
