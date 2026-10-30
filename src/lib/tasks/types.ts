export const TASK_STATUSES = [
  { value: "todo", label: "未着手" },
  { value: "in_progress", label: "進行中" },
  { value: "done", label: "完了" },
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number]["value"];

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
};

export type TaskInput = Omit<Task, "id">;

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 1000;

export function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.some((status) => status.value === value);
}
