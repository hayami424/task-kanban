import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

// Vitest は async な Server Component をレンダーできないため、データ取得部分だけ差し替える
vi.mock("@/components/TaskBoardSection", () => ({
  TaskBoardSection: () => null,
}));

test("Home ページにアプリ名の見出しが表示される", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", { level: 1, name: "タスクカンバン" }),
  ).toBeDefined();
});
