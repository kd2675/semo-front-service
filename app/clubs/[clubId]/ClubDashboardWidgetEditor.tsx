"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RouterLink } from "@/app/components/RouterLink";
import { type ClubDashboardWidgetSummary } from "@/app/lib/clubs";
import {
  getWidgetFeatureLabel,
  WIDGET_ACCENT_CLASS,
} from "./dashboardWidgetUtils";

type ClubDashboardWidgetEditorProps = {
  clubId: string;
  enabledWidgets: ClubDashboardWidgetSummary[];
  addableWidgets: ClubDashboardWidgetSummary[];
  blockedWidgets: ClubDashboardWidgetSummary[];
  activeWidget: ClubDashboardWidgetSummary | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
  onRemoveWidget: (widgetKey: string) => void;
  onAddWidget: (widgetKey: string) => void;
};

function EnabledDashboardWidgetCard({
  widget,
  onRemove,
}: {
  widget: ClubDashboardWidgetSummary;
  onRemove: (widgetKey: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.widgetKey });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative flex min-h-[96px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm ${
        isDragging ? "z-20 opacity-0" : ""
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        className="flex size-9 touch-none shrink-0 cursor-grab items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 active:cursor-grabbing"
        aria-label={`${widget.displayName} 순서 변경`}
        title="드래그해서 순서를 바꿀 수 있습니다."
      >
        <span className="material-symbols-outlined text-lg">drag_indicator</span>
      </button>
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
          WIDGET_ACCENT_CLASS[widget.widgetKey] ?? "bg-slate-100 text-slate-600"
        }`}
      >
        <span className="material-symbols-outlined text-[22px]">{widget.iconName}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-base font-bold text-slate-900">{widget.displayName}</p>
          <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
            Live
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {widget.description ?? "홈에서 빠르게 확인할 수 있는 위젯입니다."}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {getWidgetFeatureLabel(widget)}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {widget.userPath}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(widget.widgetKey)}
        className="rounded-full bg-[var(--primary)]/10 px-4 py-2 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/20"
      >
        숨김
      </button>
    </article>
  );
}

function EnabledDashboardWidgetOverlayCard({
  widget,
}: {
  widget: ClubDashboardWidgetSummary;
}) {
  return (
    <article className="pointer-events-none w-[min(calc(100vw-2rem),72rem)] rounded-2xl border border-[var(--primary)]/30 bg-white px-4 py-4 shadow-[0_20px_44px_rgba(15,23,42,0.18)] ring-2 ring-[var(--primary)]/15">
      <div className="flex min-h-[96px] items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <span className="material-symbols-outlined text-lg">drag_indicator</span>
        </div>
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
            WIDGET_ACCENT_CLASS[widget.widgetKey] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">{widget.iconName}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-slate-900">{widget.displayName}</p>
          <p className="mt-1 text-sm text-slate-500">
            {widget.description ?? "홈에서 빠르게 확인할 수 있는 위젯입니다."}
          </p>
        </div>
        <div className="rounded-full bg-[var(--primary)]/10 px-4 py-2 text-xs font-bold text-[var(--primary)]">
          순서 이동
        </div>
      </div>
    </article>
  );
}

export function ClubDashboardWidgetEditor({
  clubId,
  enabledWidgets,
  addableWidgets,
  blockedWidgets,
  activeWidget,
  onDragStart,
  onDragEnd,
  onDragCancel,
  onRemoveWidget,
  onAddWidget,
}: ClubDashboardWidgetEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--primary)]">view_quilt</span>
          <h3 className="text-lg font-bold text-slate-900">활성 위젯 순서</h3>
        </div>
        {enabledWidgets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
            현재 홈에 노출 중인 위젯이 없습니다.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
          >
            <SortableContext
              items={enabledWidgets.map((widget) => widget.widgetKey)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                {enabledWidgets.map((widget) => (
                  <EnabledDashboardWidgetCard
                    key={widget.widgetKey}
                    widget={widget}
                    onRemove={onRemoveWidget}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeWidget ? (
                <EnabledDashboardWidgetOverlayCard widget={activeWidget} />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--primary)]">add_circle</span>
          <h3 className="text-lg font-bold text-slate-900">추가 가능 위젯</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addableWidgets.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              추가 가능한 위젯이 없습니다.
            </div>
          ) : (
            addableWidgets.map((widget) => (
              <article
                key={widget.widgetKey}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
              >
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                    WIDGET_ACCENT_CLASS[widget.widgetKey] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">{widget.iconName}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-slate-900">{widget.displayName}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {widget.description ?? "홈에서 빠르게 확인할 수 있는 위젯입니다."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddWidget(widget.widgetKey)}
                  className="rounded-full bg-[var(--primary)]/10 px-4 py-2 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/20"
                >
                  추가
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-500">lock</span>
          <h3 className="text-lg font-bold text-slate-900">현재 사용할 수 없는 위젯</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {blockedWidgets.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              기능 비활성 때문에 막힌 위젯이 없습니다.
            </div>
          ) : (
            blockedWidgets.map((widget) => (
              <article
                key={widget.widgetKey}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                  <span className="material-symbols-outlined text-[22px]">{widget.iconName}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-slate-900">{widget.displayName}</p>
                  <p className="mt-1 text-sm text-slate-500">{getWidgetFeatureLabel(widget)}</p>
                </div>
                <RouterLink
                  href={`/clubs/${clubId}/admin/menu`}
                  className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-100"
                >
                  기능 켜기
                </RouterLink>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
