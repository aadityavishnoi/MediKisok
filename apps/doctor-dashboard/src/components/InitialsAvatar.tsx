const PALETTE = [
  'bg-primary-100 text-primary-700',
  'bg-secondary-100 text-secondary-700',
  'bg-warning-100 text-warning-700',
  'bg-success-100 text-success-700',
  'bg-danger-100 text-danger-700',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function InitialsAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const tone = PALETTE[hashString(name) % PALETTE.length];
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${tone}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}
