import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "SONAE — 備蓄台帳 × 安否確認",
  description:
    "防災備蓄品をリース資産のように台帳管理し、災害時の安否確認・対策本部運営までを一気通貫で支えるBCPプラットフォーム（構想検証モック）",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
