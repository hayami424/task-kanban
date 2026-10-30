import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { Task } from "@/lib/tasks/types";

const actions = vi.hoisted(() => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

// サーバー (Supabase) との境界である Server Actions をモックする
vi.mock("@/app/actions", () => actions);

import { TaskBoard } from "@/components/TaskBoard";

const tasks: Task[] = [
  { id: "task-1", title: "買い物", description: "牛乳を買う", status: "todo" },
  { id: "task-2", title: "資料作成", description: "", status: "in_progress" },
];

type ActionResult = { ok: true } | { ok: false; error: string };

// 応答を保留した Promise。Server Action の応答前に画面が更新されることを確かめるために使う。
// React 19 は保留中の非同期トランジションを全体で束ねるため、後続のテストに影響しないよう afterEach で必ず完了させる
let pendingResolvers: Array<(result: ActionResult) => void> = [];

function pending(): Promise<ActionResult> {
  return new Promise((resolve) => {
    pendingResolvers.push(resolve);
  });
}

function column(name: string) {
  return screen.getByRole("region", { name });
}

function card(title: string) {
  return screen.getByRole("article", { name: title });
}

function addForm() {
  return screen.getByRole("form", { name: "タスクを追加" });
}

beforeEach(() => {
  actions.createTask.mockResolvedValue({ ok: true });
  actions.updateTask.mockResolvedValue({ ok: true });
  actions.deleteTask.mockResolvedValue({ ok: true });
});

afterEach(async () => {
  await act(async () => {
    pendingResolvers.forEach((resolve) => resolve({ ok: true }));
  });
  pendingResolvers = [];
  cleanup();
  vi.clearAllMocks();
});

describe("一覧表示", () => {
  test("タスクがステータスに対応する列に表示される", () => {
    render(<TaskBoard tasks={tasks} />);

    expect(within(column("未着手")).getByRole("article", { name: "買い物" })).toBeDefined();
    expect(within(column("進行中")).getByRole("article", { name: "資料作成" })).toBeDefined();
    expect(within(card("買い物")).getByText("牛乳を買う")).toBeDefined();
  });

  test("タスクがない列には空であることが表示される", () => {
    render(<TaskBoard tasks={tasks} />);

    expect(within(column("完了")).getByText("タスクはありません")).toBeDefined();
    expect(within(column("未着手")).queryByText("タスクはありません")).toBeNull();
  });

  test("タスクが0件だと全ての列が空表示になる", () => {
    render(<TaskBoard tasks={[]} />);

    expect(screen.getAllByText("タスクはありません")).toHaveLength(3);
  });
});

describe("追加", () => {
  test("タイトルを入力して追加すると応答を待たずに未着手の列に表示される", async () => {
    actions.createTask.mockReturnValue(pending());
    render(<TaskBoard tasks={tasks} />);

    fireEvent.change(within(addForm()).getByLabelText("タイトル"), {
      target: { value: "掃除" },
    });
    fireEvent.change(within(addForm()).getByLabelText("説明"), {
      target: { value: "部屋を片付ける" },
    });
    fireEvent.click(within(addForm()).getByRole("button", { name: "追加" }));

    await waitFor(() => {
      expect(within(column("未着手")).getByRole("article", { name: "掃除" })).toBeDefined();
    });
    const formData: FormData = actions.createTask.mock.calls[0][0];
    expect(formData.get("title")).toBe("掃除");
    expect(formData.get("description")).toBe("部屋を片付ける");
  });

  test("追加に成功すると入力欄が空に戻る", async () => {
    render(<TaskBoard tasks={tasks} />);
    const titleInput = within(addForm()).getByLabelText<HTMLInputElement>("タイトル");

    fireEvent.change(titleInput, { target: { value: "掃除" } });
    fireEvent.click(within(addForm()).getByRole("button", { name: "追加" }));

    await waitFor(() => expect(titleInput.value).toBe(""));
  });

  test("タイトルが空のまま追加するとエラーが表示され送信されない", () => {
    render(<TaskBoard tasks={tasks} />);

    fireEvent.click(within(addForm()).getByRole("button", { name: "追加" }));

    expect(screen.getByRole("alert").textContent).toBe("タイトルを入力してください");
    expect(actions.createTask).not.toHaveBeenCalled();
  });

  test("追加に失敗するとエラーが表示され追加したタスクが消える", async () => {
    actions.createTask.mockResolvedValue({ ok: false, error: "タスクの追加に失敗しました" });
    render(<TaskBoard tasks={tasks} />);

    fireEvent.change(within(addForm()).getByLabelText("タイトル"), {
      target: { value: "掃除" },
    });
    fireEvent.click(within(addForm()).getByRole("button", { name: "追加" }));

    expect((await screen.findByRole("alert")).textContent).toBe("タスクの追加に失敗しました");
    await waitFor(() => {
      expect(screen.queryByRole("article", { name: "掃除" })).toBeNull();
    });
  });
});

describe("編集", () => {
  test("編集ボタンを押すと現在の値が入った編集フォームが表示される", () => {
    render(<TaskBoard tasks={tasks} />);

    fireEvent.click(within(card("買い物")).getByRole("button", { name: "編集" }));

    const form = screen.getByRole("form", { name: "タスクを編集" });
    expect(within(form).getByLabelText<HTMLInputElement>("タイトル").value).toBe("買い物");
    expect(within(form).getByLabelText<HTMLTextAreaElement>("説明").value).toBe("牛乳を買う");
    expect(within(form).getByLabelText<HTMLSelectElement>("ステータス").value).toBe("todo");
  });

  test("タイトルとステータスを変えて保存すると応答を待たずに別の列へ移動する", async () => {
    actions.updateTask.mockReturnValue(pending());
    render(<TaskBoard tasks={tasks} />);

    fireEvent.click(within(card("買い物")).getByRole("button", { name: "編集" }));
    const form = screen.getByRole("form", { name: "タスクを編集" });
    fireEvent.change(within(form).getByLabelText("タイトル"), {
      target: { value: "買い出し" },
    });
    fireEvent.change(within(form).getByLabelText("ステータス"), {
      target: { value: "done" },
    });
    fireEvent.click(within(form).getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(within(column("完了")).getByRole("article", { name: "買い出し" })).toBeDefined();
    });
    expect(screen.queryByRole("article", { name: "買い物" })).toBeNull();
    expect(screen.queryByRole("form", { name: "タスクを編集" })).toBeNull();
    const [id, formData] = actions.updateTask.mock.calls[0];
    expect(id).toBe("task-1");
    expect(formData.get("title")).toBe("買い出し");
    expect(formData.get("status")).toBe("done");
  });

  test("編集中にキャンセルすると表示に戻り内容は変わらない", () => {
    render(<TaskBoard tasks={tasks} />);

    fireEvent.click(within(card("買い物")).getByRole("button", { name: "編集" }));
    const form = screen.getByRole("form", { name: "タスクを編集" });
    fireEvent.change(within(form).getByLabelText("タイトル"), {
      target: { value: "買い出し" },
    });
    fireEvent.click(within(form).getByRole("button", { name: "キャンセル" }));

    expect(screen.queryByRole("form", { name: "タスクを編集" })).toBeNull();
    expect(within(column("未着手")).getByRole("article", { name: "買い物" })).toBeDefined();
    expect(actions.updateTask).not.toHaveBeenCalled();
  });

  test("タイトルを空にして保存するとエラーが表示され編集フォームが残る", () => {
    render(<TaskBoard tasks={tasks} />);

    fireEvent.click(within(card("買い物")).getByRole("button", { name: "編集" }));
    const form = screen.getByRole("form", { name: "タスクを編集" });
    fireEvent.change(within(form).getByLabelText("タイトル"), { target: { value: "" } });
    fireEvent.click(within(form).getByRole("button", { name: "保存" }));

    expect(screen.getByRole("alert").textContent).toBe("タイトルを入力してください");
    expect(screen.getByRole("form", { name: "タスクを編集" })).toBeDefined();
    expect(actions.updateTask).not.toHaveBeenCalled();
  });

  test("更新に失敗するとエラーが表示され元の内容に戻る", async () => {
    actions.updateTask.mockResolvedValue({ ok: false, error: "タスクの更新に失敗しました" });
    render(<TaskBoard tasks={tasks} />);

    fireEvent.click(within(card("買い物")).getByRole("button", { name: "編集" }));
    const form = screen.getByRole("form", { name: "タスクを編集" });
    fireEvent.change(within(form).getByLabelText("タイトル"), {
      target: { value: "買い出し" },
    });
    fireEvent.click(within(form).getByRole("button", { name: "保存" }));

    expect((await screen.findByRole("alert")).textContent).toBe("タスクの更新に失敗しました");
    await waitFor(() => {
      expect(within(column("未着手")).getByRole("article", { name: "買い物" })).toBeDefined();
    });
  });
});

describe("削除", () => {
  test("削除ボタンを押すと対象のタイトルを含む確認ダイアログが表示される", () => {
    render(<TaskBoard tasks={tasks} />);

    fireEvent.click(within(card("買い物")).getByRole("button", { name: "削除" }));

    const dialog = screen.getByRole("alertdialog", { name: "タスクの削除" });
    expect(within(dialog).getByText("「買い物」を削除しますか？")).toBeDefined();
    expect(actions.deleteTask).not.toHaveBeenCalled();
  });

  test("確認ダイアログでキャンセルするとダイアログが閉じタスクは残る", () => {
    render(<TaskBoard tasks={tasks} />);

    fireEvent.click(within(card("買い物")).getByRole("button", { name: "削除" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "キャンセル" }),
    );

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(card("買い物")).toBeDefined();
    expect(actions.deleteTask).not.toHaveBeenCalled();
  });

  test("確認ダイアログで削除すると応答を待たずにタスクが消える", async () => {
    actions.deleteTask.mockReturnValue(pending());
    render(<TaskBoard tasks={tasks} />);

    fireEvent.click(within(card("買い物")).getByRole("button", { name: "削除" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "削除する" }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("article", { name: "買い物" })).toBeNull();
    });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(card("資料作成")).toBeDefined();
    expect(actions.deleteTask).toHaveBeenCalledWith("task-1");
  });

  test("削除に失敗するとエラーが表示されタスクが元に戻る", async () => {
    actions.deleteTask.mockResolvedValue({ ok: false, error: "タスクの削除に失敗しました" });
    render(<TaskBoard tasks={tasks} />);

    fireEvent.click(within(card("買い物")).getByRole("button", { name: "削除" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "削除する" }),
    );

    expect((await screen.findByRole("alert")).textContent).toBe("タスクの削除に失敗しました");
    await waitFor(() => expect(card("買い物")).toBeDefined());
  });
});

describe("サーバーからの再取得", () => {
  test("新しいタスク一覧が渡されると表示が置き換わる", () => {
    const { rerender } = render(<TaskBoard tasks={tasks} />);

    rerender(
      <TaskBoard tasks={[{ id: "task-3", title: "掃除", description: "", status: "done" }]} />,
    );

    expect(within(column("完了")).getByRole("article", { name: "掃除" })).toBeDefined();
    expect(screen.queryByRole("article", { name: "買い物" })).toBeNull();
  });
});
