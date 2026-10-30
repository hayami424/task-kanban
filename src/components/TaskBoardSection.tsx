import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getTasks } from "@/lib/tasks/queries";
import type { Task } from "@/lib/tasks/types";
import { TaskBoard } from "./TaskBoard";

export async function TaskBoardSection() {
  let tasks: Task[];
  try {
    tasks = await getTasks();
  } catch {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertDescription>
          タスクの取得に失敗しました。時間をおいて再読み込みしてください。
        </AlertDescription>
      </Alert>
    );
  }

  return <TaskBoard tasks={tasks} />;
}
