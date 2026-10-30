import {
  DESCRIPTION_MAX_LENGTH,
  isTaskStatus,
  TITLE_MAX_LENGTH,
  type TaskInput,
} from "./types";

export type ValidationResult =
  | { ok: true; value: TaskInput }
  | { ok: false; error: string };

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

// フォーム入力を検証する。制約は DB (tasks テーブル) の check 制約と揃えている
export function validateTaskInput(formData: FormData): ValidationResult {
  const title = getString(formData, "title").trim();
  const description = getString(formData, "description");
  const status = formData.get("status") ?? "todo";

  if (title.length === 0) {
    return { ok: false, error: "タイトルを入力してください" };
  }
  if (title.length > TITLE_MAX_LENGTH) {
    return {
      ok: false,
      error: `タイトルは${TITLE_MAX_LENGTH}文字以内で入力してください`,
    };
  }
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    return {
      ok: false,
      error: `説明は${DESCRIPTION_MAX_LENGTH}文字以内で入力してください`,
    };
  }
  if (!isTaskStatus(status)) {
    return { ok: false, error: "ステータスが不正です" };
  }

  return { ok: true, value: { title, description, status } };
}
