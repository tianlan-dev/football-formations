import assert from "node:assert/strict";
import { test } from "node:test";
import { FORMATIONS, POSITIONS, formationsUsing, slotsByLine } from "./formations.ts";

test("阵型 id 唯一", () => {
  const ids = FORMATIONS.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("每个阵型 11 个点位，且只有一名门将", () => {
  for (const f of FORMATIONS) {
    assert.equal(f.slots.length, 11, f.name);
    assert.equal(f.slots.filter((s) => s.pos === "GK").length, 1, f.name);
  }
});

test("点位都在已知位置表内，坐标在球场范围内", () => {
  for (const f of FORMATIONS) {
    for (const s of f.slots) {
      assert.ok(POSITIONS[s.pos], `${f.name} ${s.pos}`);
      assert.ok(s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100, `${f.name} ${s.pos}`);
      assert.ok(s.duty.length > 0, `${f.name} ${s.pos}`);
    }
  }
});

test("slotsByLine 不丢点位", () => {
  for (const f of FORMATIONS) {
    const total = slotsByLine(f.slots).reduce((n, g) => n + g.slots.length, 0);
    assert.equal(total, 11, f.name);
  }
});

test("formationsUsing 返回包含该位置的阵型", () => {
  for (const f of formationsUsing("GK")) {
    assert.ok(f.slots.some((s) => s.pos === "GK"));
  }
  assert.equal(formationsUsing("GK").length, FORMATIONS.length);
});
