"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateTaskInput } from "@/lib/tasks/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

const missingIdResult: ActionResult = {
  ok: false,
  error: "タスクが指定されていません",
};

export async function createTask(formData: FormData): Promise<ActionResult> {
  const input = validateTaskInput(formData);
  if (!input.ok) {
    return input;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert(input.value);
  if (error) {
    return { ok: false, error: "タスクの追加に失敗しました" };
  }

  refresh();
  return { ok: true };
}

export async function updateTask(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!id) {
    return missingIdResult;
  }
  const input = validateTaskInput(formData);
  if (!input.ok) {
    return input;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update(input.value)
    .eq("id", id);
  if (error) {
    return { ok: false, error: "タスクの更新に失敗しました" };
  }

  refresh();
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  if (!id) {
    return missingIdResult;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) {
    return { ok: false, error: "タスクの削除に失敗しました" };
  }

  refresh();
  return { ok: true };
}
