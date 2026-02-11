import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/store/AppContext";

export const metadata: Metadata = {
  title: "P2P Collab - 채팅 · 파일공유 · 프로젝트",
  description: "P2P 채팅, 파일 전송, 프로젝트 및 일정 관리 웹앱",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
