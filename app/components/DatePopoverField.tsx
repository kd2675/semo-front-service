"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const POPOVER_WIDTH = 336;
const POPOVER_HEIGHT = 430;
const VIEWPORT_PADDING = 12;
const POPOVER_OFFSET = 8;

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

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function addDays(date: Date, count: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  next.setHours(0, 0, 0, 0);
  return next;
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
  const popoverId = useId();
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const dayButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12 });

  const selectedDate = useMemo(
    () => parseDate(value),
    [value],
  );
  const min = useMemo(() => parseDate(minDate), [minDate]);
  const max = useMemo(() => parseDate(maxDate), [maxDate]);
  const [cursor, setCursor] = useState(() => startOfMonth(selectedDate ?? new Date()));
  const [focusedDate, setFocusedDate] = useState(() => selectedDate ?? startOfDay(new Date()));

  const constrainDate = (date: Date) => {
    if (min && isBeforeDay(date, min)) {
      return min;
    }
    if (max && isAfterDay(date, max)) {
      return max;
    }
    return date;
  };

  const handleToggleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }

    if (anchorRef.current) {
      setPosition(resolvePopoverPosition(anchorRef.current));
    }
    const nextFocusedDate = constrainDate(selectedDate ?? startOfDay(new Date()));
    setCursor(startOfMonth(nextFocusedDate));
    setFocusedDate(nextFocusedDate);
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
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      dayButtonRefs.current.get(formatDateValue(focusedDate))?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(focusFrame);
  }, [cursor, focusedDate, open]);

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
  const calendarRows = useMemo(
    () => Array.from({ length: 6 }, (_, index) => calendarDays.slice(index * 7, index * 7 + 7)),
    [calendarDays],
  );

  const moveFocusedDate = (nextDate: Date) => {
    const constrained = constrainDate(nextDate);
    setFocusedDate(constrained);
    if (constrained.getMonth() !== cursor.getMonth() || constrained.getFullYear() !== cursor.getFullYear()) {
      setCursor(startOfMonth(constrained));
    }
  };

  const handleDayKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    let nextDate: Date | null = null;
    switch (event.key) {
      case "ArrowLeft":
        nextDate = addDays(focusedDate, -1);
        break;
      case "ArrowRight":
        nextDate = addDays(focusedDate, 1);
        break;
      case "ArrowUp":
        nextDate = addDays(focusedDate, -7);
        break;
      case "ArrowDown":
        nextDate = addDays(focusedDate, 7);
        break;
      case "Home":
        nextDate = addDays(focusedDate, -focusedDate.getDay());
        break;
      case "End":
        nextDate = addDays(focusedDate, 6 - focusedDate.getDay());
        break;
      default:
        return;
    }

    event.preventDefault();
    moveFocusedDate(nextDate);
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
          {value ? formatDateLabel(value) : placeholder}
        </span>
        <span className="material-symbols-outlined text-[20px] text-slate-400" aria-hidden="true">{iconName}</span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              id={popoverId}
              ref={popoverRef}
              className="calendar-popover"
              role="dialog"
              aria-label="날짜 선택"
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
                        moveFocusedDate(addMonths(cursor, -1));
                      }
                    }}
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_left</span>
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
                        moveFocusedDate(addMonths(cursor, 1));
                      }
                    }}
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_right</span>
                  </button>
                </div>

                <div className="cp-week-row" role="row">
                  {WEEK_LABELS.map((label) => (
                    <div key={label} className="cp-week" role="columnheader" aria-label={`${label}요일`}>
                      {label}
                    </div>
                  ))}
                </div>

                <div className="cp-day-grid" role="grid" aria-label={`${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`}>
                  {calendarRows.map((week, weekIndex) => (
                    <div className="cp-day-row" role="row" key={`${formatDateValue(week[0])}-${weekIndex}`}>
                      {week.map((day) => {
                        const dateValue = formatDateValue(day);
                        const outside = day.getMonth() !== cursor.getMonth();
                        const disabledDay = Boolean(
                          (min && isBeforeDay(day, min)) || (max && isAfterDay(day, max)),
                        );
                        const selected = sameDay(day, selectedDate);
                        const focused = sameDay(day, focusedDate);

                        return (
                          <button
                            key={dateValue}
                            ref={(node) => {
                              if (node) {
                                dayButtonRefs.current.set(dateValue, node);
                              } else {
                                dayButtonRefs.current.delete(dateValue);
                              }
                            }}
                            type="button"
                            role="gridcell"
                            disabled={disabledDay}
                            tabIndex={focused ? 0 : -1}
                            aria-label={formatDateLabel(dateValue)}
                            aria-selected={selected}
                            className={`cp-day ${outside ? "is-outside" : ""} ${selected ? "is-selected" : ""}`}
                            onFocus={() => setFocusedDate(day)}
                            onKeyDown={handleDayKeyDown}
                            onClick={() => {
                              onChange(dateValue);
                              setOpen(false);
                              anchorRef.current?.focus({ preventScroll: true });
                            }}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  ))}
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
