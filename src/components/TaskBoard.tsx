"use client";

import {
  useId,
  useOptimistic,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { createTask, deleteTask, updateTask, type ActionResult } from "@/app/actions";
import { CircleAlert, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/tasks/types";
import { validateTaskInput } from "@/lib/tasks/validation";
import { ConfirmDialog } from "./ConfirmDialog";
import { TaskCard } from "./TaskCard";

type OptimisticTask = Task & { pending?: boolean };

type OptimisticAction =
  | { type: "add"; task: OptimisticTask }
  | { type: "update"; task: Task }
  | { type: "delete"; id: string };

function applyAction(
  tasks: OptimisticTask[],
  action: OptimisticAction,
): OptimisticTask[] {
  switch (action.type) {
    case "add":
      return [...tasks, action.task];
    case "update":
      return tasks.map((task) => (task.id === action.task.id ? action.task : task));
    case "delete":
      return tasks.filter((task) => task.id !== action.id);
  }
}

// 列見出しのドットの色
const statusAccent: Record<TaskStatus, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-500",
  done: "bg-emerald-500",
};

export function TaskBoard({ tasks }: { tasks: Task[] }) {
  // Server Action の応答を待たずに画面へ反映し、サーバーから最新の tasks が届いたら置き換わる
  const [optimisticTasks, applyOptimistic] = useOptimistic<OptimisticTask[], OptimisticAction>(
    tasks,
    applyAction,
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  function runAction(action: OptimisticAction, request: () => Promise<ActionResult>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      applyOptimistic(action);
      const result = await request();
      // await 後の更新はトランジション外になるため、再度 startTransition で包む
      startTransition(() => {
        if (result.ok) {
          onSuccess?.();
        } else {
          setError(result.error);
        }
      });
    });
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const input = validateTaskInput(formData);
    if (!input.ok) {
      setError(input.error);
      return;
    }
    runAction(
      { type: "add", task: { id: `pending-${crypto.randomUUID()}`, ...input.value, pending: true } },
      () => createTask(formData),
      () => form.reset(),
    );
  }

  function handleSave(task: Task, formData: FormData): boolean {
    const input = validateTaskInput(formData);
    if (!input.ok) {
      setError(input.error);
      return false;
    }
    runAction({ type: "update", task: { id: task.id, ...input.value } }, () =>
      updateTask(task.id, formData),
    );
    return true;
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }
    const { id } = deleteTarget;
    setDeleteTarget(null);
    runAction({ type: "delete", id }, () => deleteTask(id));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent>
          <form
            aria-label="タスクを追加"
            onSubmit={handleAdd}
            className="flex flex-col gap-3 sm:flex-row sm:items-start"
          >
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor={titleId}>タイトル</Label>
              <Input id={titleId} name="title" placeholder="例: 企画書を作成する" />
            </div>
            <div className="flex flex-[1.5] flex-col gap-1.5">
              <Label htmlFor={descriptionId}>説明</Label>
              <Textarea
                id={descriptionId}
                name="description"
                rows={1}
                placeholder="詳細（任意）"
                className="min-h-8 resize-none py-[5px]"
              />
            </div>
            <Button type="submit" className="sm:mt-5">
              <Plus data-icon="inline-start" />
              追加
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-4 md:grid-cols-3">
        {TASK_STATUSES.map((status) => {
          const columnTasks = optimisticTasks.filter((task) => task.status === status.value);
          return (
            <section
              key={status.value}
              aria-label={status.label}
              className="flex flex-col gap-3 rounded-xl border bg-muted/50 p-3"
            >
              <h2 className="flex items-center gap-2 px-1 text-sm font-semibold">
                <span aria-hidden="true" className={`size-2 rounded-full ${statusAccent[status.value]}`} />
                {status.label}
                <Badge variant="secondary" className="ml-auto tabular-nums">
                  {columnTasks.length}
                </Badge>
              </h2>
              {columnTasks.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  タスクはありません
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    pending={task.pending ?? false}
                    onSave={(formData) => handleSave(task, formData)}
                    onDeleteRequest={() => setDeleteTarget(task)}
                  />
                ))
              )}
            </section>
          );
        })}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="タスクの削除"
          message={`「${deleteTarget.title}」を削除しますか？`}
          confirmLabel="削除する"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
