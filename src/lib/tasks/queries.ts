import { createClient } from "@/lib/supabase/server";
import { isTaskStatus, type Task } from "./types";

// 全タスクを作成順に取得する
export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, description, status")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`タスクの取得に失敗しました: ${error.message}`);
  }

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: isTaskStatus(row.status) ? row.status : "todo",
  }));
}
