const RELATIVE_TIME_UNITS: Record<string, string> = {
  s: "초",
  m: "분",
  h: "시간",
  d: "일",
  w: "주",
};

export function localizeRelativeTimeLabel(label: string) {
  const normalized = label.trim();
  if (/^(just now|now)$/i.test(normalized)) {
    return "방금 전";
  }

  const match = /^(\d+)\s*([smhdw])\s*ago$/i.exec(normalized);
  if (!match) {
    return normalized;
  }

  const unit = RELATIVE_TIME_UNITS[match[2].toLowerCase()] ?? match[2];
  return `${match[1]}${unit} 전`;
}
