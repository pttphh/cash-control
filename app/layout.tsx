import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "거래처 매출·수금 관리",
  description: "거래처별 출고/발행/수금/금고 출금 관리",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
