"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const POPOVER_WIDTH = 304;
const POPOVER_HEIGHT = 336;
const VIEWPORT_PADDING = 12;
const POPOVER_OFFSET = 8;

type TimePopoverFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  buttonClassName?: string;
  iconName?: string;
};

type ParsedTime = {
  hour: number;
  minute: number;
};

function parseTime(value: string | null | undefined): ParsedTime | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

function formatUnit(value: number) {
  return String(value).padStart(2, "0");
}

function formatTimeValue(hour: number, minute: number) {
  return `${formatUnit(hour)}:${formatUnit(minute)}`;
}

function formatTimeLabel(value: string) {
  const parsed = parseTime(value);
  if (!parsed) {
    return value;
  }

  const period = parsed.hour < 12 ? "오전" : "오후";
  const displayHour = parsed.hour % 12 || 12;
  return `${period} ${formatUnit(displayHour)}:${formatUnit(parsed.minute)}`;
}

function getDefaultDraftTime(): ParsedTime {
  return {
    hour: new Date().getHours(),
    minute: 0,
  };
}

function resolvePopoverPosition(anchor: HTMLButtonElement, width = POPOVER_WIDTH, height = POPOVER_HEIGHT) {
  const rect = anchor.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let left = rect.left;
  let top = rect.bottom + POPOVER_OFFSET;

  if (left + width > viewportWidth - VIEWPORT_PADDING) {
    left = viewportWidth - width - VIEWPORT_PADDING;
  }
  if (left < VIEWPORT_PADDING) {
    left = VIEWPORT_PADDING;
  }
  if (top + height > viewportHeight - VIEWPORT_PADDING) {
    top = rect.top - height - POPOVER_OFFSET;
  }
  if (top < VIEWPORT_PADDING) {
    top = VIEWPORT_PADDING;
  }

  return { left, top };
}

export function TimePopoverField({
  value,
  onChange,
  placeholder = "시간을 선택하세요",
  disabled = false,
  buttonClassName,
  iconName = "schedule",
}: TimePopoverFieldProps) {
  const popoverId = useId();
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const hourButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const minuteButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const hasFocusedOnOpenRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: VIEWPORT_PADDING, top: VIEWPORT_PADDING });
  const [draftTime, setDraftTime] = useState<ParsedTime>(() => getDefaultDraftTime());

  const selectedTime = useMemo(() => parseTime(value), [value]);

  const syncDraftTime = () => {
    setDraftTime(selectedTime ?? getDefaultDraftTime());
  };

  const handleToggleOpen = () => {
    if (open) {
      setOpen(false);
      hasFocusedOnOpenRef.current = false;
      return;
    }

    syncDraftTime();
    if (anchorRef.current) {
      setPosition(resolvePopoverPosition(anchorRef.current));
    }
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      return;
    }

    setPosition(
      resolvePopoverPosition(
        anchorRef.current,
        popoverRef.current?.offsetWidth || POPOVER_WIDTH,
        popoverRef.current?.offsetHeight || POPOVER_HEIGHT,
      ),
    );

    hourButtonRefs.current[draftTime.hour]?.scrollIntoView({ block: "center" });
    minuteButtonRefs.current[draftTime.minute]?.scrollIntoView({ block: "center" });
    if (!hasFocusedOnOpenRef.current) {
      hourButtonRefs.current[draftTime.hour]?.focus({ preventScroll: true });
      hasFocusedOnOpenRef.current = true;
    }
  }, [draftTime.hour, draftTime.minute, open]);

  useEffect(() => {
    if (!open) {
      hasFocusedOnOpenRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updatePosition = () => {
      if (!anchorRef.current) {
        return;
      }

      setPosition(
        resolvePopoverPosition(
          anchorRef.current,
          popoverRef.current?.offsetWidth || POPOVER_WIDTH,
          popoverRef.current?.offsetHeight || POPOVER_HEIGHT,
        ),
      );
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || anchorRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        hasFocusedOnOpenRef.current = false;
        anchorRef.current?.focus({ preventScroll: true });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleHourSelect = (hour: number) => {
    const nextTime = { ...draftTime, hour };
    setDraftTime(nextTime);
    onChange(formatTimeValue(nextTime.hour, nextTime.minute));
  };

  const handleMinuteSelect = (minute: number) => {
    const nextTime = { ...draftTime, minute };
    setDraftTime(nextTime);
    onChange(formatTimeValue(nextTime.hour, nextTime.minute));
  };

  const handleUnitKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    unit: "hour" | "minute",
    value: number,
  ) => {
    const lastValue = unit === "hour" ? HOURS.length - 1 : MINUTES.length - 1;
    let nextValue: number | null = null;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        nextValue = Math.min(value + 1, lastValue);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        nextValue = Math.max(value - 1, 0);
        break;
      case "Home":
        nextValue = 0;
        break;
      case "End":
        nextValue = lastValue;
        break;
      default:
        return;
    }

    event.preventDefault();
    const refs = unit === "hour" ? hourButtonRefs : minuteButtonRefs;
    refs.current[nextValue]?.focus({ preventScroll: true });
  };

  const closePopover = () => {
    setOpen(false);
    hasFocusedOnOpenRef.current = false;
    anchorRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={handleToggleOpen}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? popoverId : undefined}
        className={`semo-control flex w-full items-center justify-between border border-slate-200 bg-white px-4 py-3 text-left text-sm outline-none transition hover:border-[var(--primary)] disabled:opacity-60 ${buttonClassName ?? ""}`}
      >
        <span className={value ? "font-semibold text-slate-900" : "text-slate-400"}>
          {value ? formatTimeLabel(value) : placeholder}
        </span>
        <span className="material-symbols-outlined text-[20px] text-slate-400" aria-hidden="true">{iconName}</span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              id={popoverId}
              ref={popoverRef}
              className="fixed z-[1086] w-[304px] overflow-hidden rounded-[var(--radius-modal)] border border-slate-200 bg-white shadow-[var(--shadow-modal)]"
              role="dialog"
              aria-label="시간 선택"
              aria-modal="false"
              style={{ left: position.left, top: position.top }}
            >
              <div className="border-b border-slate-200 bg-[var(--background-light)] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500">선택한 시간</p>
                    <p className="mt-1 text-base font-black text-slate-900">
                      {value ? formatTimeLabel(value) : "시간을 골라주세요"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closePopover}
                    className="semo-icon-control rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                    aria-label="시간 선택 닫기"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3">
                <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-2 shadow-sm">
                  <p className="px-2 pb-2 text-xs font-bold text-slate-500">시</p>
                  <div className="max-h-56 space-y-1 overflow-y-auto pr-1" role="listbox" aria-label="시 선택">
                    {HOURS.map((hour) => {
                      const active = draftTime.hour === hour;
                      return (
                        <button
                          key={hour}
                          ref={(node) => {
                            hourButtonRefs.current[hour] = node;
                          }}
                          type="button"
                          role="option"
                          onClick={() => handleHourSelect(hour)}
                          onKeyDown={(event) => handleUnitKeyDown(event, "hour", hour)}
                          tabIndex={active ? 0 : -1}
                          className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
                            active
                              ? "bg-[var(--primary)] text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                          aria-selected={active}
                        >
                          <span>{formatUnit(hour)}</span>
                          <span className={`text-xs font-black uppercase tracking-[0.16em] ${active ? "text-white/80" : "text-slate-300"}`}>
                            시
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-2 shadow-sm">
                  <p className="px-2 pb-2 text-xs font-bold text-slate-500">분</p>
                  <div className="max-h-56 space-y-1 overflow-y-auto pr-1" role="listbox" aria-label="분 선택">
                    {MINUTES.map((minute) => {
                      const active = draftTime.minute === minute;
                      return (
                        <button
                          key={minute}
                          ref={(node) => {
                            minuteButtonRefs.current[minute] = node;
                          }}
                          type="button"
                          role="option"
                          onClick={() => handleMinuteSelect(minute)}
                          onKeyDown={(event) => handleUnitKeyDown(event, "minute", minute)}
                          tabIndex={active ? 0 : -1}
                          className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
                            active
                              ? "bg-[var(--primary)] text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                          aria-selected={active}
                        >
                          <span>{formatUnit(minute)}</span>
                          <span className={`text-xs font-black uppercase tracking-[0.16em] ${active ? "text-white/80" : "text-slate-300"}`}>
                            분
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setDraftTime(getDefaultDraftTime());
                    closePopover();
                  }}
                  className="semo-control inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  지우기
                </button>
                <button
                  type="button"
                  onClick={closePopover}
                  className="semo-control inline-flex items-center gap-2 bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
                >
                  완료
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
