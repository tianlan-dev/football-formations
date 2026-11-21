import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  FORMATIONS,
  GROUPS,
  POSITIONS,
  POS_ORDER,
  formationsUsing,
  slotsByLine,
  type Formation,
  type Group,
  type PosId,
} from "@/data/formations";
import { MiniPitch, Pitch } from "@/components/pitch";

type View = "pitch" | "roster" | "lexicon";
type Filter = "全部" | Group;
type LabelMode = "zh" | "en";

const STORAGE_KEY = "zhenxian-formation";

const TRAITS = [
  ["宽度", "width"],
  ["控球", "control"],
  ["压迫", "press"],
  ["厚度", "shield"],
] as const;

export function TacticsApp() {
  const [view, setView] = useState<View>("pitch");
  const [filter, setFilter] = useState<Filter>("全部");
  const [query, setQuery] = useState("");
  const [labelMode, setLabelMode] = useState<LabelMode>("zh");
  const [formationId, setFormationId] = useState(FORMATIONS[0].id);
  const [slotIndex, setSlotIndex] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && FORMATIONS.some((formation) => formation.id === saved)) {
      setFormationId(saved);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, formationId);
  }, [formationId, ready]);

  const q = query.trim().toLowerCase();

  const visible = useMemo(() => {
    return FORMATIONS.filter((formation) => {
      if (filter !== "全部" && formation.group !== filter) return false;
      if (!q) return true;
      if (matchesFormation(formation, q)) return true;
      return formation.slots.some((slot) => matchesPos(slot.pos, q));
    });
  }, [filter, q]);

  const formation = FORMATIONS.find((item) => item.id === formationId) ?? FORMATIONS[0];

  useEffect(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>(`[data-chip="${formation.id}"]`)].filter(
      (node) => node.offsetParent !== null,
    );
    for (const el of nodes) {
      const scroller = el.closest(".scroller");
      if (scroller instanceof HTMLElement) {
        scroller.scrollTo({
          left: el.offsetLeft - scroller.clientWidth / 2 + el.clientWidth / 2,
          behavior: "auto",
        });
      } else {
        el.scrollIntoView({ block: "nearest" });
      }
    }
  }, [formation.id, view, filter]);

  function openFormation(id: string, index: number | null = null) {
    setFormationId(id);
    setSlotIndex(index);
    setView("pitch");
  }

  function step(dir: number) {
    const list = visible.length > 0 ? visible : FORMATIONS;
    const current = Math.max(
      0,
      list.findIndex((item) => item.id === formation.id),
    );
    const next = list[(current + dir + list.length) % list.length];
    setFormationId(next.id);
    setSlotIndex(null);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function chooseFilter(next: Filter) {
    setFilter(next);
    const list = FORMATIONS.filter((formation) => next === "全部" || formation.group === next);
    if (!list.some((item) => item.id === formationId)) {
      setFormationId(list[0].id);
      setSlotIndex(null);
    }
  }

  const matches = formation.slots.map((slot) => (q ? matchesPos(slot.pos, q) : false));
  const detail = (
    <Detail
      formation={formation}
      slotIndex={slotIndex}
      onSelect={setSlotIndex}
      onOpen={openFormation}
    />
  );

  return (
    <div className="min-h-dvh bg-bg text-fg md:grid md:h-dvh md:grid-cols-[15.5rem_minmax(0,1fr)] md:overflow-hidden lg:grid-cols-[15.5rem_minmax(0,1fr)_22rem]">
      <aside className="hidden min-h-0 border-border md:flex md:flex-col md:overflow-hidden md:border-r">
        <div className="border-b border-border px-4 py-4">
          <Brand />
        </div>
        <div className="px-3 pt-3">
          <Search value={query} onChange={setQuery} />
          <FilterRow filter={filter} onChange={chooseFilter} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <FormationList
            items={visible.length ? visible : []}
            activeId={formation.id}
            onPick={(id) => {
              setFormationId(id);
              setSlotIndex(null);
              setView("pitch");
            }}
          />
          {visible.length === 0 && <Empty query={query} />}
        </div>
      </aside>

      <main className="min-w-0 md:overflow-y-auto">
        <header className="sticky top-0 z-10 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 md:hidden">
            <Brand />
          </div>
          <div className="mt-3 flex items-center gap-2 md:mt-0">
            <ViewSwitch view={view} onChange={setView} />
            <LabelSwitch mode={labelMode} onChange={setLabelMode} />
          </div>
          <div className={"mt-3 md:hidden " + (view === "pitch" ? "hidden" : "")}>
            <Search value={query} onChange={setQuery} />
          </div>
        </header>

        {view === "pitch" && (
          <div className="px-4 py-4">
            <div className="md:hidden">
              <FilterRow filter={filter} onChange={chooseFilter} />
              <ChipRow
                items={visible}
                activeId={formation.id}
                onPick={(id) => {
                  setFormationId(id);
                  setSlotIndex(null);
                }}
              />
              {visible.length === 0 && <Empty query={query} />}
            </div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <IconButton label="上一套阵型" onClick={() => step(-1)}>
                <ChevronLeft className="size-5" />
              </IconButton>
              <div className="min-w-0 text-center">
                <h1 className="font-display text-4xl leading-none tracking-wide text-balance">
                  {formation.name}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {formation.title} · {formation.group}
                </p>
              </div>
              <IconButton label="下一套阵型" onClick={() => step(1)}>
                <ChevronRight className="size-5" />
              </IconButton>
            </div>
            <Pitch
              formation={formation}
              selected={slotIndex}
              labelMode={labelMode}
              matches={matches}
              onSelect={(index) => setSlotIndex(slotIndex === index ? null : index)}
            />
            <p className="mt-2 text-center text-xs text-muted">本方球门在下。点球员看这个点的具体名字和职责。</p>
            <div className="mt-4 lg:hidden">{detail}</div>
          </div>
        )}

        {view === "roster" && (
          <Roster
            items={visible}
            query={query}
            onOpen={(id) => openFormation(id, null)}
          />
        )}

        {view === "lexicon" && (
          <Lexicon
            query={q}
            onOpen={(id, pos) => {
              const target = FORMATIONS.find((item) => item.id === id);
              const index = target?.slots.findIndex((slot) => slot.pos === pos) ?? -1;
              openFormation(id, index >= 0 ? index : null);
            }}
          />
        )}
      </main>

      <aside className="hidden min-h-0 border-l border-border lg:block lg:overflow-y-auto">
        <div className="p-4">
          {view === "pitch" ? (
            detail
          ) : (
            <p className="text-sm text-muted text-pretty">回到球场，点一个位置，这里会写出它在当前阵型里的名字和职责。</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-md bg-pitch font-display text-sm text-primary">
        XI
      </span>
      <div>
        <p className="font-display text-xl leading-none tracking-wide">阵线</p>
        <p className="mt-1 text-xs text-muted">足球阵型与位置</p>
      </div>
    </div>
  );
}

function Search({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="搜阵型或位置，例如 后腰、边锋"
      aria-label="搜索阵型或位置"
      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-fg placeholder:text-muted md:text-sm"
    />
  );
}

function FilterRow({ filter, onChange }: { filter: Filter; onChange: (filter: Filter) => void }) {
  const options: Filter[] = ["全部", ...GROUPS];
  return (
    <div className="mt-3 flex gap-2" role="tablist" aria-label="阵型分类">
      {options.map((option) => {
        const on = filter === option;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(option)}
            className={
              "min-h-11 flex-1 rounded-lg border px-2 text-sm " +
              (on
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-surface text-fg")
            }
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function ViewSwitch({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  const tabs: { id: View; label: string }[] = [
    { id: "pitch", label: "球场" },
    { id: "roster", label: "名册" },
    { id: "lexicon", label: "位置" },
  ];
  return (
    <div className="grid flex-1 grid-cols-3 rounded-lg bg-surface p-1" role="tablist" aria-label="查看方式">
      {tabs.map((tab) => {
        const on = view === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.id)}
            className={
              "min-h-11 rounded-md text-sm " + (on ? "bg-surface-2 text-fg" : "text-muted")
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function LabelSwitch({ mode, onChange }: { mode: LabelMode; onChange: (mode: LabelMode) => void }) {
  return (
    <div className="grid shrink-0 grid-cols-2 rounded-lg bg-surface p-1">
      {(
        [
          ["zh", "中文"],
          ["en", "缩写"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={mode === id}
          onClick={() => onChange(id)}
          className={
            "min-h-11 rounded-md px-3 text-sm " +
            (mode === id ? "bg-surface-2 text-fg" : "text-muted")
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ChipRow({
  items,
  activeId,
  onPick,
}: {
  items: Formation[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="scroller -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
      {items.map((formation) => {
        const on = formation.id === activeId;
        return (
          <button
            key={formation.id}
            type="button"
            data-chip={formation.id}
            aria-pressed={on}
            onClick={() => onPick(formation.id)}
            className={
              "min-h-11 shrink-0 rounded-full border px-3 text-sm " +
              (on
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-surface text-fg")
            }
          >
            <span className="font-display tracking-wide">{formation.name}</span>
            <span className="ml-1.5">{formation.title}</span>
          </button>
        );
      })}
    </div>
  );
}

function FormationList({
  items,
  activeId,
  onPick,
}: {
  items: Formation[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  let last = "";
  return (
    <div className="mt-2">
      {items.map((formation) => {
        const show = formation.group !== last;
        last = formation.group;
        const on = formation.id === activeId;
        return (
          <div key={formation.id}>
            {show && (
              <p className="px-2 pt-4 pb-1 text-xs text-muted">{formation.group}</p>
            )}
            <button
              type="button"
              data-chip={formation.id}
              onClick={() => onPick(formation.id)}
              aria-current={on ? "true" : undefined}
              className={
                "flex min-h-11 w-full items-baseline gap-2 rounded-lg px-2 text-left " +
                (on ? "bg-primary text-primary-fg" : "hover:bg-surface")
              }
            >
              <span className="font-display text-lg tracking-wide">{formation.name}</span>
              <span className={"text-sm " + (on ? "text-primary-fg" : "text-muted")}>
                {formation.title}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Detail({
  formation,
  slotIndex,
  onSelect,
  onOpen,
}: {
  formation: Formation;
  slotIndex: number | null;
  onSelect: (index: number | null) => void;
  onOpen: (id: string, index: number | null) => void;
}) {
  const selected = slotIndex === null ? null : formation.slots[slotIndex];
  const position = selected ? POSITIONS[selected.pos] : null;
  const others = position
    ? formationsUsing(selected!.pos).filter((item) => item.id !== formation.id)
    : [];

  return (
    <div className="space-y-4">
      {position && selected ? (
        <article className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted">
                {position.line} · {position.zone}
              </p>
              <h2 className="mt-1 text-2xl font-medium text-balance">{position.name}</h2>
              <p className="text-sm text-primary">
                {position.en} · {position.code}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="min-h-11 shrink-0 rounded-lg border border-border px-3 text-sm text-muted"
            >
              看整套
            </button>
          </div>
          <p className="mt-4 text-xs text-muted">在这套 {formation.name} 里</p>
          <p className="mt-1 text-sm leading-relaxed text-pretty">{selected.duty}</p>
          <p className="mt-4 text-xs text-muted">这个名字一般指</p>
          <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">{position.summary}</p>
          {others.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted">同样叫这个名字的阵型</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {others.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const index = item.slots.findIndex((slot) => slot.pos === selected.pos);
                      onOpen(item.id, index);
                    }}
                    className="min-h-11 rounded-full border border-border px-3 text-sm"
                  >
                    {item.name} {item.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </article>
      ) : (
        <article className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">{formation.group}</p>
          <h2 className="mt-1 font-display text-3xl leading-none tracking-wide">
            {formation.name}
            <span className="ml-2 font-sans text-lg text-muted">{formation.title}</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-pretty">{formation.blurb}</p>
          <div className="mt-4 space-y-2">
            {TRAITS.map(([label, key]) => (
              <Meter key={key} label={label} value={formation[key]} />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">四项是阵型之间的相对倾向，不是比赛统计。</p>
          <p className="mt-4 text-xs text-muted">适合</p>
          <p className="mt-1 text-sm text-pretty">{formation.scene}</p>
          <p className="mt-3 text-xs text-muted">常见样子</p>
          <p className="mt-1 text-sm text-pretty">{formation.example}</p>
        </article>
      )}

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs text-muted">这套阵的十一个位置</p>
        <div className="mt-3 space-y-3">
          {slotsByLine(formation.slots).map((group) => (
            <div key={group.line}>
              <p className="text-xs text-primary">{group.line}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {group.slots.map(({ slot, index }) => {
                  const pos = POSITIONS[slot.pos];
                  const on = slotIndex === index;
                  return (
                    <button
                      key={pos.code}
                      type="button"
                      aria-pressed={on}
                      onClick={() => onSelect(on ? null : index)}
                      className={
                        "min-h-11 rounded-full border px-3 text-sm " +
                        (on
                          ? "border-primary bg-primary text-primary-fg"
                          : "border-border text-fg")
                      }
                    >
                      {pos.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-xs text-muted">{label}</span>
      <div className="flex flex-1 gap-1" aria-label={`${label} ${value} / 5`}>
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={"h-1.5 flex-1 rounded-full " + (index < value ? "bg-primary" : "bg-border")}
          />
        ))}
      </div>
    </div>
  );
}

function Roster({
  items,
  query,
  onOpen,
}: {
  items: Formation[];
  query: string;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="space-y-3 px-4 py-4">
      <p className="text-sm text-muted">
        {query.trim() ? `找到 ${items.length} 套` : `共 ${items.length} 套现代常用阵型`}
        。每套都列出十一个具体位置名。
      </p>
      {items.length === 0 && <Empty query={query} />}
      {items.map((formation) => (
        <article key={formation.id} className="rounded-2xl border border-border bg-surface p-3">
          <div className="flex gap-3">
            <div className="w-16 shrink-0">
              <MiniPitch slots={formation.slots} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl leading-none tracking-wide">{formation.name}</h2>
                <span className="text-xs text-muted">{formation.group}</span>
              </div>
              <p className="mt-1 text-sm text-primary">{formation.title}</p>
              <p className="mt-2 text-sm text-muted text-pretty">{formation.blurb}</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {slotsByLine(formation.slots).map((group) => (
              <p key={group.line} className="text-sm">
                <span className="text-muted">{group.line}</span>
                <span className="mx-2 text-border">·</span>
                {group.slots.map(({ slot }) => POSITIONS[slot.pos].name).join("、")}
              </p>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onOpen(formation.id)}
            className="mt-3 min-h-11 w-full rounded-lg border border-border text-sm"
          >
            在球场上看
          </button>
        </article>
      ))}
    </div>
  );
}

function Lexicon({
  query,
  onOpen,
}: {
  query: string;
  onOpen: (formationId: string, pos: PosId) => void;
}) {
  const items = POS_ORDER.filter((id) => !query || matchesPos(id, query)).map((id) => POSITIONS[id]);
  let last = "";
  return (
    <div className="space-y-3 px-4 py-4">
      <p className="text-sm text-muted text-pretty">
        位置名录。同一个代码在不同阵型里站的地方不一样，点下面的阵型可以跳回去看。
      </p>
      {items.length === 0 && <Empty query={query} />}
      {items.map((position) => {
        const show = position.line !== last;
        last = position.line;
        const hosts = formationsUsing(position.code as PosId);
        return (
          <div key={position.code}>
            {show && <h2 className="pt-2 text-sm text-primary">{position.line}</h2>}
            <article className="mt-2 rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-xl font-medium">{position.name}</h3>
                <span className="font-display text-lg tracking-wide text-primary">{position.code}</span>
              </div>
              <p className="text-sm text-muted">
                {position.en} · {position.zone}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-pretty">{position.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {hosts.map((formation) => (
                  <button
                    key={formation.id}
                    type="button"
                    onClick={() => onOpen(formation.id, position.code as PosId)}
                    className="min-h-11 rounded-full border border-border px-3 text-sm"
                  >
                    {formation.name} {formation.title}
                  </button>
                ))}
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-surface"
    >
      {children}
    </button>
  );
}

function Empty({ query }: { query: string }) {
  return (
    <p className="py-6 text-sm text-muted">没有和「{query.trim() || "这个条件"}」对上的阵型或位置。</p>
  );
}

function matchesPos(pos: PosId, query: string) {
  const position = POSITIONS[pos];
  return [position.name, position.en, position.code, position.pitchEn, position.summary, position.zone]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function matchesFormation(formation: Formation, query: string) {
  return [formation.name, formation.title, formation.group, formation.blurb, formation.scene, formation.example]
    .join(" ")
    .toLowerCase()
    .includes(query);
}
