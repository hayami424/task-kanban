"use client";

import { useId, useState, type FormEvent } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { TASK_STATUSES, type Task } from "@/lib/tasks/types";

type TaskCardProps = {
  task: Task;
  // サーバーへの保存が終わっていない (仮の) タスクは操作できないようにする
  pending: boolean;
  // 入力が有効で保存を開始できたら true を返す
  onSave: (formData: FormData) => boolean;
  onDeleteRequest: () => void;
};

export function TaskCard({ task, pending, onSave, onDeleteRequest }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const statusId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onSave(new FormData(event.currentTarget))) {
      setIsEditing(false);
    }
  }

  return (
    <article aria-label={task.title}>
      <Card
        size="sm"
        className={`transition-shadow hover:shadow-md ${pending ? "opacity-60" : ""} ${isEditing ? "ring-2 ring-ring/40" : ""}`}
      >
        {isEditing ? (
          <CardContent>
            <form aria-label="タスクを編集" onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={titleId}>タイトル</Label>
                <Input id={titleId} name="title" defaultValue={task.title} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={descriptionId}>説明</Label>
                <Textarea
                  id={descriptionId}
                  name="description"
                  defaultValue={task.description}
                  rows={3}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={statusId}>ステータス</Label>
                <NativeSelect id={statusId} name="status" defaultValue={task.status} className="w-full">
                  {TASK_STATUSES.map((status) => (
                    <NativeSelectOption key={status.value} value={status.value}>
                      {status.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  キャンセル
                </Button>
                <Button type="submit" size="sm">
                  保存
                </Button>
              </div>
            </form>
          </CardContent>
        ) : (
          <CardHeader>
            <CardTitle className="break-words">{task.title}</CardTitle>
            {task.description && (
              <CardDescription className="whitespace-pre-wrap break-words">
                {task.description}
              </CardDescription>
            )}
            <CardAction className="flex items-center gap-0.5">
              {pending && (
                <Loader2 aria-hidden="true" className="mr-1 size-3.5 animate-spin text-muted-foreground" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="編集"
                onClick={() => setIsEditing(true)}
                disabled={pending}
              >
                <Pencil />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="削除"
                className="hover:bg-destructive/10 hover:text-destructive"
                onClick={onDeleteRequest}
                disabled={pending}
              >
                <Trash2 />
              </Button>
            </CardAction>
          </CardHeader>
        )}
      </Card>
    </article>
  );
}
