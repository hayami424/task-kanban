import { describe, expect, test } from "vitest";
import { validateTaskInput } from "@/lib/tasks/validation";

function buildFormData(fields: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("validateTaskInput", () => {
  test("タイトル・説明・ステータスが正しいと前後の空白を除いた値を返す", () => {
    const result = validateTaskInput(
      buildFormData({ title: "  買い物  ", description: "牛乳", status: "in_progress" }),
    );

    expect(result).toEqual({
      ok: true,
      value: { title: "買い物", description: "牛乳", status: "in_progress" },
    });
  });

  test("説明とステータスが省略されると説明は空文字・ステータスは未着手になる", () => {
    const result = validateTaskInput(buildFormData({ title: "買い物" }));

    expect(result).toEqual({
      ok: true,
      value: { title: "買い物", description: "", status: "todo" },
    });
  });

  test("タイトルが空だとエラーになる", () => {
    const result = validateTaskInput(buildFormData({ title: "" }));

    expect(result).toEqual({ ok: false, error: "タイトルを入力してください" });
  });

  test("タイトルが空白だけだとエラーになる", () => {
    const result = validateTaskInput(buildFormData({ title: "   " }));

    expect(result).toEqual({ ok: false, error: "タイトルを入力してください" });
  });

  test("タイトルが未送信だとエラーになる", () => {
    const result = validateTaskInput(new FormData());

    expect(result).toEqual({ ok: false, error: "タイトルを入力してください" });
  });

  test("タイトルが100文字ちょうどだと有効になる", () => {
    const result = validateTaskInput(buildFormData({ title: "あ".repeat(100) }));

    expect(result.ok).toBe(true);
  });

  test("タイトルが101文字だとエラーになる", () => {
    const result = validateTaskInput(buildFormData({ title: "あ".repeat(101) }));

    expect(result).toEqual({
      ok: false,
      error: "タイトルは100文字以内で入力してください",
    });
  });

  test("説明が1000文字ちょうどだと有効になる", () => {
    const result = validateTaskInput(
      buildFormData({ title: "買い物", description: "あ".repeat(1000) }),
    );

    expect(result.ok).toBe(true);
  });

  test("説明が1001文字だとエラーになる", () => {
    const result = validateTaskInput(
      buildFormData({ title: "買い物", description: "あ".repeat(1001) }),
    );

    expect(result).toEqual({
      ok: false,
      error: "説明は1000文字以内で入力してください",
    });
  });

  test("定義されていないステータスだとエラーになる", () => {
    const result = validateTaskInput(
      buildFormData({ title: "買い物", status: "archived" }),
    );

    expect(result).toEqual({ ok: false, error: "ステータスが不正です" });
  });
});
