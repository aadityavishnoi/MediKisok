import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface MiniCalendarProps {
  initialDate?: Date;
  onSelectDate?: (date: Date) => void;
}

export function MiniCalendar({ initialDate = new Date(), onSelectDate }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthName = currentMonth.toLocaleString('default', { month: 'long' });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const handlePrev = () => setCurrentMonth(new Date(year, month - 1, 1));
  const handleNext = () => setCurrentMonth(new Date(year, month + 1, 1));

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day: number) => {
    return selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-900">{monthName} {year}</h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {days.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} />;
          const todayStyle = isToday(d);
          const selStyle = isSelected(d);
          return (
            <button
              key={`day-${d}`}
              type="button"
              onClick={() => {
                const dateObj = new Date(year, month, d);
                setSelectedDate(dateObj);
                onSelectDate?.(dateObj);
              }}
              className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center font-medium transition-all ${
                selStyle
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : todayStyle
                    ? 'border-2 border-blue-600 text-blue-600 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
