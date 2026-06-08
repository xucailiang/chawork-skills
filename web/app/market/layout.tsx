import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "技能市场",
};

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
