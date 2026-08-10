"use client";

import { motion } from "motion/react";
import type { ClubDashboardWidgetCardProps } from "../types/dashboardWidgetTypes";
import { ClubDashboardWidgetContent } from "./ClubDashboardWidgetContent";

export type { ClubDashboardWidgetCardProps } from "../types/dashboardWidgetTypes";

export function ClubDashboardWidgetCard(props: ClubDashboardWidgetCardProps) {
  const { widget, editMode, isAdmin, isDragging, isDropTarget, isDisabled, reduceMotion, onDragOver, onDrop, onDragStart, onDragEnd, onTouchDragStart, onRemove } =
    props;
  const spanClass = [
    widget.columnSpan >= 2 ? "md:col-span-2" : "",
    widget.rowSpan >= 3 ? "md:row-span-3" : widget.rowSpan === 2 ? "md:row-span-2" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const isEditMode = isAdmin && editMode;
  const baseBoxShadow = "0 1px 2px rgba(15, 23, 42, 0.06)";

  return (
    <motion.article
      key={widget.widgetKey}
      data-widget-key={widget.widgetKey}
      onDragOver={(event) => {
        if (!isEditMode) {
          return;
        }
        event.preventDefault();
        onDragOver(widget.widgetKey);
      }}
      onDrop={(event) => {
        if (!isEditMode) {
          return;
        }
        event.preventDefault();
        onDrop(widget.widgetKey);
      }}
      className={`relative flex min-h-[180px] flex-col rounded-xl border bg-white p-5 shadow-sm transition ${
        isDropTarget ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20" : "border-slate-200"
      } ${isDragging ? "opacity-60" : ""} ${spanClass}`}
      animate={{ scale: 1, boxShadow: baseBoxShadow }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
    >
      {isEditMode ? (
        <div className="absolute left-3 top-3 z-10">
          <button
            type="button"
            draggable={!isDisabled}
            onDragStart={(event) => {
              if (isDisabled) {
                return;
              }
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", widget.widgetKey);
              onDragStart(widget.widgetKey);
            }}
            onDragEnd={onDragEnd}
            onTouchStart={() => {
              if (!isDisabled) {
                onTouchDragStart(widget.widgetKey);
              }
            }}
            className="flex size-11 touch-none items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 active:cursor-grabbing"
            aria-label="위젯 순서 이동"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">drag_indicator</span>
          </button>
        </div>
      ) : null}
      {isEditMode ? (
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => onRemove(widget.widgetKey)}
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:text-rose-500"
          aria-label="위젯 제거"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
        </button>
      ) : null}

      <ClubDashboardWidgetContent {...props} />
    </motion.article>
  );
}
