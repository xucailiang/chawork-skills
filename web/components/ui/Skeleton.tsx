export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-sm)",
        animation: "skeleton-pulse 1.8s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Skeleton style={{ width: 28, height: 28, borderRadius: 8 }} />
        <Skeleton style={{ width: 60, height: 20, borderRadius: 999 }} />
      </div>
      <Skeleton style={{ width: "75%", height: 20 }} />
      <Skeleton style={{ width: "100%", height: 14 }} />
      <Skeleton style={{ width: "60%", height: 14 }} />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 60, padding: "40px 0" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <Skeleton style={{ width: 80, height: 40 }} />
          <Skeleton style={{ width: 60, height: 16 }} />
        </div>
      ))}
    </div>
  );
}
