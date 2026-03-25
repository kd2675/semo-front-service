"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

type DatePopoverFieldProps = {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
  buttonClassName?: string;
  iconName?: string;
};

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime())
    || date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string) {
  const date = parseDate(value);
  if (!date) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function sameDay(left: Date | null, right: Date | null) {
  if (!left || !right) {
    return false;
  }
  return (
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
  );
}

function isBeforeDay(left: Date, right: Date) {
  return left.getTime() < right.getTime();
}

function isAfterDay(left: Date, right: Date) {
  return left.getTime() > right.getTime();
}

function buildCalendarDays(monthCursor: Date) {
  const monthStart = startOfMonth(monthCursor);
  const firstGridDay = new Date(monthStart);
  firstGridDay.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstGridDay);
    day.setDate(firstGridDay.getDate() + index);
    day.setHours(0, 0, 0, 0);
    return day;
  });
}

export function DatePopoverField({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "날짜를 선택하세요",
  disabled = false,
  buttonClassName,
  iconName = "calendar_month",
}: DatePopoverFieldProps) {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12 });

  const selectedDate = useMemo(
    () => parseDate(value),
    [value],
  );
  const min = useMemo(() => parseDate(minDate), [minDate]);
  const max = useMemo(() => parseDate(maxDate), [maxDate]);
  const [cursor, setCursor] = useState(() => startOfMonth(selectedDate ?? new Date()));

  useEffect(() => {
    if (!open) {
      return;
    }

    const updatePosition = () => {
      if (!anchorRef.current || !popoverRef.current) {
        return;
      }
      const rect = anchorRef.current.getBoundingClientRect();
      const width = popoverRef.current.offsetWidth || 286;
      const height = popoverRef.current.offsetHeight || 360;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      let left = rect.left;
      let top = rect.bottom + 8;

      if (left + width > viewportWidth - 12) {
        left = viewportWidth - width - 12;
      }
      if (left < 12) {
        left = 12;
      }
      if (top + height > viewportHeight - 12) {
        top = rect.top - height - 8;
      }
      if (top < 12) {
        top = 12;
      }

      setPosition({ left, top });
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
        setOpen(false);
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

  const canMovePrev = useMemo(() => {
    if (!min) {
      return true;
    }
    return !isBeforeDay(addMonths(cursor, -1), startOfMonth(min));
  }, [cursor, min]);

  const canMoveNext = useMemo(() => {
    if (!max) {
      return true;
    }
    return !isAfterDay(addMonths(cursor, 1), startOfMonth(max));
  }, [cursor, max]);

  const calendarDays = useMemo(() => buildCalendarDays(cursor), [cursor]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((current) => {
            const nextOpen = !current;
            if (nextOpen) {
              setCursor(startOfMonth(selectedDate ?? new Date()));
            }
            return nextOpen;
          });
        }}
        className={`flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm outline-none transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName ?? ""}`}
      >
        <span className={value ? "font-semibold text-slate-900" : "text-slate-400"}>
          {value ? formatDateLabel(value) : placeholder}
        </span>
        <span className="material-symbols-outlined text-[20px] text-slate-400">{iconName}</span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={popoverRef}
              className="calendar-popover"
              role="dialog"
              aria-modal="false"
              style={{ left: position.left, top: position.top }}
            >
              <div className="calendar-popover__inner">
                <div className="cp-head">
                  <button
                    type="button"
                    className="cp-nav cp-nav-prev"
                    aria-label="이전 달"
                    disabled={!canMovePrev}
                    onClick={() => {
                      if (canMovePrev) {
                        setCursor((current) => addMonths(current, -1));
                      }
                    }}
                  >
                    {"<"}
                  </button>
                  <div className="cp-title">
                    {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
                  </div>
                  <button
                    type="button"
                    className="cp-nav cp-nav-next"
                    aria-label="다음 달"
                    disabled={!canMoveNext}
                    onClick={() => {
                      if (canMoveNext) {
                        setCursor((current) => addMonths(current, 1));
                      }
                    }}
                  >
                    {">"}
                  </button>
                </div>

                <div className="cp-week-row">
                  {WEEK_LABELS.map((label) => (
                    <div key={label} className="cp-week">
                      {label}
                    </div>
                  ))}
                </div>

                <div className="cp-day-grid">
                  {calendarDays.map((day) => {
                    const outside = day.getMonth() !== cursor.getMonth();
                    const disabledDay = Boolean(
                      (min && isBeforeDay(day, min)) || (max && isAfterDay(day, max)),
                    );
                    const selected = sameDay(day, selectedDate);

                    return (
                      <button
                        key={formatDateValue(day)}
                        type="button"
                        disabled={disabledDay}
                        className={`cp-day ${outside ? "is-outside" : ""} ${selected ? "is-selected" : ""}`}
                        onClick={() => {
                          onChange(formatDateValue(day));
                          setOpen(false);
                        }}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>

                <div className="cp-foot">
                  {value ? `선택됨 ${value}` : "날짜를 선택하세요"}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
