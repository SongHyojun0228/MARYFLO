"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

const KANBAN_COLUMNS = [
  { id: "NEW", label: "신규", color: "#A8D5BA" },
  { id: "CONTACTED", label: "상담중", color: "#6B7280" },
  { id: "QUOTE_SENT", label: "견적발송", color: "#1B1B1B" },
  { id: "VISIT_SCHEDULED", label: "방문예약", color: "#8EC5A4" },
  { id: "CONTRACTED", label: "계약완료", color: "#D4AF37" },
] as const;

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  status: string;
  desiredDate: string | null;
  guestCount: number | null;
  source: string;
  createdAt: string;
  assignedStaff: { name: string } | null;
}

function getElapsedTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) {
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins}분 전`;
  }
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// Droppable column
function KanbanColumn({
  column,
  leads,
  activeId,
}: {
  column: (typeof KANBAN_COLUMNS)[number];
  leads: LeadItem[];
  activeId: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-2xl bg-[#FAF9F6] transition-colors sm:w-auto sm:flex-1",
        isOver && "bg-[#A8D5BA]/10"
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <span className="text-sm font-medium text-[#1B1B1B]">
          {column.label}
        </span>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-[#6B7280] shadow-sm">
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
        {leads.map((lead) => (
          <DraggableCard
            key={lead.id}
            lead={lead}
            isDragging={activeId === lead.id}
          />
        ))}
        {leads.length === 0 && (
          <div className="py-8 text-center text-xs text-[#6B7280]">
            문의 고객 없음
          </div>
        )}
      </div>
    </div>
  );
}

// Draggable card
function DraggableCard({
  lead,
  isDragging,
}: {
  lead: LeadItem;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
    data: lead,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-30"
      )}
    >
      <LeadCard lead={lead} />
    </div>
  );
}

// Card content (reused in DragOverlay)
function LeadCard({ lead }: { lead: LeadItem }) {
  return (
    <Link
      href={`/dashboard/leads/${lead.id}`}
      onClick={(e) => {
        // Prevent navigation during drag
        if ((e.target as HTMLElement).closest("[data-dragging]")) {
          e.preventDefault();
        }
      }}
      className="block rounded-xl bg-white p-3 shadow-lg transition-shadow hover:shadow-xl"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[#1B1B1B]">{lead.name}</p>
        <span className="text-[10px] text-[#6B7280]">
          {getElapsedTime(lead.createdAt)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6B7280]">
        {lead.desiredDate && (
          <span>📅 {formatDate(lead.desiredDate)}</span>
        )}
        {lead.guestCount && <span>👥 {lead.guestCount}명</span>}
      </div>

      {lead.assignedStaff && (
        <p className="mt-2 text-[11px] text-[#6B7280]">
          담당: {lead.assignedStaff.name}
        </p>
      )}
    </Link>
  );
}

export function LeadKanban({ initialLeads }: { initialLeads: LeadItem[] }) {
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const activeLead = activeId
    ? leads.find((l) => l.id === activeId) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;
    const lead = leads.find((l) => l.id === leadId);

    if (!lead || lead.status === newStatus) return;

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    // Persist
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, status: lead.status } : l
          )
        );
        toast.error("상태 변경에 실패했습니다.");
      }
    } catch {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, status: lead.status } : l
        )
      );
      toast.error("서버 오류가 발생했습니다.");
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 sm:gap-4">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            leads={leads.filter((l) => l.status === column.id)}
            activeId={activeId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="w-72 rotate-2 opacity-90 sm:w-auto">
            <LeadCard lead={activeLead} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
