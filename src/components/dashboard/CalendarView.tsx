"use client";

import { useState } from "react";
import Link from "next/link";
import { LEAD_STATUS_LABELS } from "@/lib/constants";

interface CalendarLead {
  id: string;
  name: string;
  phone: string;
  desiredDate: string;
  guestCount: number | null;
  status: string;
}

interface CalendarViewProps {
  leads: CalendarLead[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarView({ leads }: CalendarViewProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build a map: "YYYY-MM-DD" -> leads[]
  const leadsByDate = new Map<string, CalendarLead[]>();
  for (const lead of leads) {
    const key = lead.desiredDate.slice(0, 10);
    if (!leadsByDate.has(key)) leadsByDate.set(key, []);
    leadsByDate.get(key)!.push(lead);
  }

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null) as null[];

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  function getDateKey(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function prevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  }

  const selectedLeads = selectedDate ? (leadsByDate.get(selectedDate) ?? []) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar */}
      <div className="rounded-2xl bg-white p-5 shadow-lg lg:col-span-2">
        {/* Month nav */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="rounded-lg px-3 py-1.5 text-sm text-[#6B7280] hover:bg-[#FAF9F6]"
          >
            &larr;
          </button>
          <span className="text-sm font-semibold text-[#1B1B1B]">
            {year}년 {month + 1}월
          </span>
          <button
            onClick={nextMonth}
            className="rounded-lg px-3 py-1.5 text-sm text-[#6B7280] hover:bg-[#FAF9F6]"
          >
            &rarr;
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-center text-xs font-medium text-[#6B7280]">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {weeks.map((w, wi) =>
            w.map((day, di) => {
              if (day === null) {
                return <div key={`${wi}-${di}`} className="h-12 border-t border-gray-50 sm:h-16" />;
              }
              const key = getDateKey(day);
              const dayLeads = leadsByDate.get(key) ?? [];
              const isSelected = selectedDate === key;
              const isToday =
                day === now.getDate() &&
                month === now.getMonth() &&
                year === now.getFullYear();

              return (
                <button
                  key={`${wi}-${di}`}
                  onClick={() => setSelectedDate(key)}
                  className={`flex h-12 flex-col items-center justify-start border-t border-gray-50 pt-1 transition-colors sm:h-16 ${
                    isSelected
                      ? "bg-[#A8D5BA]/15"
                      : "hover:bg-[#FAF9F6]"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday
                        ? "bg-[#1B1B1B] font-semibold text-white"
                        : "text-[#1B1B1B]"
                    }`}
                  >
                    {day}
                  </span>
                  {dayLeads.length > 0 && (
                    <span className="mt-1 rounded-full bg-[#A8D5BA] px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {dayLeads.length}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected day leads */}
      <div className="rounded-2xl bg-white p-5 shadow-lg lg:col-span-1">
        <h2 className="mb-3 text-sm font-semibold text-[#1B1B1B]">
          {selectedDate
            ? `${parseInt(selectedDate.slice(5, 7))}/${parseInt(selectedDate.slice(8, 10))} 문의`
            : "날짜를 선택하세요"}
        </h2>

        {!selectedDate ? (
          <p className="py-8 text-center text-sm text-[#6B7280]">
            캘린더에서 날짜를 클릭하면
            <br />
            해당 일자 문의를 볼 수 있습니다.
          </p>
        ) : selectedLeads.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#6B7280]">
            해당 날짜에 문의가 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/dashboard/leads/${lead.id}`}
                className="block rounded-xl border border-gray-100 p-3 transition-colors hover:bg-[#FAF9F6]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#1B1B1B]">
                    {lead.name}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={getStatusStyle(lead.status)}
                  >
                    {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#6B7280]">
                  {lead.phone}
                  {lead.guestCount && ` · ${lead.guestCount}명`}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusStyle(status: string): React.CSSProperties {
  switch (status) {
    case "CONTRACTED":
      return { backgroundColor: "#FFF8E1", color: "#D4AF37" };
    case "LOST":
      return { backgroundColor: "#FFEBEE", color: "#C62828" };
    case "NEW":
      return { backgroundColor: "#E8F5E9", color: "#2E7D32" };
    default:
      return { backgroundColor: "#F5F5F5", color: "#6B7280" };
  }
}
