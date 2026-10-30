import { Suspense } from "react";
import { SquareKanban } from "lucide-react";
import { TaskBoardSection } from "@/components/TaskBoardSection";
import { Skeleton } from "@/components/ui/skeleton";

function TaskBoardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <span className="sr-only">読み込み中…</span>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((column) => (
          <div key={column} className="flex flex-col gap-3 rounded-xl border bg-muted/50 p-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <SquareKanban aria-hidden="true" className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">タスクカンバン</h1>
          <p className="text-sm text-muted-foreground">タスクを追加して、進み具合に合わせて列を移動しましょう</p>
        </div>
      </header>
      {/* タスクはリクエストごとに取得するため Suspense でストリーミングする */}
      <Suspense fallback={<TaskBoardSkeleton />}>
        <TaskBoardSection />
      </Suspense>
    </main>
  );
}
