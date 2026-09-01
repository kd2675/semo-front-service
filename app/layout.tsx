/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-semo-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SEMO",
    template: "%s · SEMO",
  },
  description: "모임의 활동과 운영 기록을 다음 사람에게 이어가는 SEMO",
};

export const viewport: Viewport = {
  themeColor: "#135bec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className={`${plusJakartaSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
