import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4" />
          <span>&copy; {new Date().getFullYear()} ChaWork</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a
            href="https://github.com/xucailiang/chawork"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <a href="/market/skills" className="hover:text-foreground transition-colors">
            技能市场
          </a>
          <a href="/market/employees" className="hover:text-foreground transition-colors">
            员工市场
          </a>
        </div>
      </div>
    </footer>
  );
}
