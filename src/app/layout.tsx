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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
