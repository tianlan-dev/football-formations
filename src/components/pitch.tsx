import { POSITIONS, type Formation, type PosId } from "@/data/formations";

type Props = {
  formation: Formation;
  selected: number | null;
  labelMode: "zh" | "en";
  matches: boolean[];
  onSelect: (index: number) => void;
};

export function Pitch({ formation, selected, labelMode, matches, onSelect }: Props) {
  return (
    <div className="pitch-sizer mx-auto">
      <div className="pitch-grass aspect-pitch relative overflow-hidden rounded-2xl">
        <PitchMarkings />
        <p className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 text-xs text-fg/80">
          进攻 ↑
        </p>
        {formation.slots.map((slot, index) => {
          const position = POSITIONS[slot.pos];
          const on = selected === index;
          return (
            <button
              key={index}
              type="button"
              className="pin"
              data-on={on}
              data-keeper={position.code === "GK"}
              data-match={matches[index] && !on}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              aria-pressed={on}
              aria-label={`${position.name}，${position.en}`}
              onClick={() => onSelect(index)}
            >
              <span className="pin-disc">{labelMode === "zh" ? position.name : position.code}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MiniPitch({ slots }: { slots: { pos: PosId; x: number; y: number }[] }) {
  return (
    <div className="pitch-grass relative aspect-pitch w-full overflow-hidden rounded-lg" aria-hidden="true">
      <PitchMarkings />
      {slots.map((slot, index) => (
        <span
          key={index}
          className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg"
          style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
        />
      ))}
    </div>
  );
}

function PitchMarkings() {
  return (
    <svg
      viewBox="0 0 80 118"
      className="pointer-events-none absolute inset-0 h-full w-full text-line"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.55" opacity="0.9">
        <rect x="6" y="6" width="68" height="105" />
        <line x1="6" y1="58.5" x2="74" y2="58.5" />
        <circle cx="40" cy="58.5" r="9.15" />
        <circle cx="40" cy="58.5" r="0.55" fill="currentColor" stroke="none" />
        <rect x="19.84" y="6" width="40.32" height="16.5" />
        <rect x="30.84" y="6" width="18.32" height="5.5" />
        <circle cx="40" cy="17" r="0.5" fill="currentColor" stroke="none" />
        <path d="M32.7 22.5 A 9.15 9.15 0 0 1 47.3 22.5" />
        <rect x="19.84" y="94.5" width="40.32" height="16.5" />
        <rect x="30.84" y="105.5" width="18.32" height="5.5" />
        <circle cx="40" cy="100" r="0.5" fill="currentColor" stroke="none" />
        <path d="M32.7 94.5 A 9.15 9.15 0 0 0 47.3 94.5" />
        <path d="M6 7.2 A 1.2 1.2 0 0 0 7.2 6" />
        <path d="M72.8 6 A 1.2 1.2 0 0 0 74 7.2" />
        <path d="M7.2 111 A 1.2 1.2 0 0 0 6 109.8" />
        <path d="M74 109.8 A 1.2 1.2 0 0 0 72.8 111" />
        <path d="M36.34 6 V 3.3 H 43.66 V 6" />
        <path d="M36.34 111 V 113.7 H 43.66 V 111" />
      </g>
    </svg>
  );
}
