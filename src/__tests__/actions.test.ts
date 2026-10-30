import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const eq = vi.fn();
  const insert = vi.fn();
  const update = vi.fn(() => ({ eq }));
  const remove = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ insert, update, delete: remove }));
  const refresh = vi.fn();
  return { eq, insert, update, remove, from, refresh };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mocks.from })),
}));

vi.mock("next/cache", () => ({ refresh: mocks.refresh }));

import { createTask, deleteTask, updateTask } from "@/app/actions";

function buildFormData(fields: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

beforeEach(() => {
  mocks.insert.mockResolvedValue({ error: null });
  mocks.eq.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createTask", () => {
  test("正しい入力だと tasks テーブルに追加して画面を再取得し成功を返す", async () => {
    const result = await createTask(
      buildFormData({ title: "買い物", description: "牛乳" }),
    );

    expect(result).toEqual({ ok: true });
    expect(mocks.from).toHaveBeenCalledWith("tasks");
    expect(mocks.insert).toHaveBeenCalledWith({
      title: "買い物",
      description: "牛乳",
      status: "todo",
    });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  test("タイトルが空だと DB に書き込まずエラーを返す", async () => {
    const result = await createTask(buildFormData({ title: "" }));

    expect(result).toEqual({ ok: false, error: "タイトルを入力してください" });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  test("Supabase がエラーを返すと失敗を返し画面を再取得しない", async () => {
    mocks.insert.mockResolvedValue({ error: { message: "db error" } });

    const result = await createTask(buildFormData({ title: "買い物" }));

    expect(result).toEqual({ ok: false, error: "タスクの追加に失敗しました" });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});

describe("updateTask", () => {
  test("正しい入力だと指定 ID のタスクを更新して画面を再取得し成功を返す", async () => {
    const result = await updateTask(
      "task-1",
      buildFormData({ title: "資料作成", description: "", status: "done" }),
    );

    expect(result).toEqual({ ok: true });
    expect(mocks.update).toHaveBeenCalledWith({
      title: "資料作成",
      description: "",
      status: "done",
    });
    expect(mocks.eq).toHaveBeenCalledWith("id", "task-1");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  test("不正なステータスだと DB に書き込まずエラーを返す", async () => {
    const result = await updateTask(
      "task-1",
      buildFormData({ title: "資料作成", status: "archived" }),
    );

    expect(result).toEqual({ ok: false, error: "ステータスが不正です" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  test("ID が空だと DB に書き込まずエラーを返す", async () => {
    const result = await updateTask("", buildFormData({ title: "資料作成" }));

    expect(result).toEqual({ ok: false, error: "タスクが指定されていません" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  test("Supabase がエラーを返すと失敗を返し画面を再取得しない", async () => {
    mocks.eq.mockResolvedValue({ error: { message: "db error" } });

    const result = await updateTask("task-1", buildFormData({ title: "資料作成" }));

    expect(result).toEqual({ ok: false, error: "タスクの更新に失敗しました" });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});

describe("deleteTask", () => {
  test("指定 ID のタスクを削除して画面を再取得し成功を返す", async () => {
    const result = await deleteTask("task-1");

    expect(result).toEqual({ ok: true });
    expect(mocks.remove).toHaveBeenCalledTimes(1);
    expect(mocks.eq).toHaveBeenCalledWith("id", "task-1");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  test("ID が空だと DB に書き込まずエラーを返す", async () => {
    const result = await deleteTask("");

    expect(result).toEqual({ ok: false, error: "タスクが指定されていません" });
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  test("Supabase がエラーを返すと失敗を返し画面を再取得しない", async () => {
    mocks.eq.mockResolvedValue({ error: { message: "db error" } });

    const result = await deleteTask("task-1");

    expect(result).toEqual({ ok: false, error: "タスクの削除に失敗しました" });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
