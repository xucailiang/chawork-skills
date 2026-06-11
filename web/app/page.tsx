import { Suspense } from "react";
import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { Stats } from "@/components/home/Stats";
import { StatsSkeleton } from "@/components/ui/Skeleton";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
      <Features />
    </>
  );
}
