import React, { useState, useMemo } from 'react';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

export default function CalendarGrid({ events = [], onSelectEvent, t }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // Header month names
  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Event type variants
  const variants = {
    prestation: 'ocre',
    repetition: 'vert',
    stage: 'bleu',
    reunion: 'kraft',
    atelier: 'jaune'
  };

  // Generate calendar days
  const calendarCells = useMemo(() => {
    // First day of current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    // Day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    let startDayOfWeek = firstDayOfMonth.getDay();
    // Convert to Monday-start (0 = Monday, ..., 6 = Sunday)
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    // Total days in current month
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Total days in previous month
    const prevMonthDate = new Date(currentYear, currentMonth, 0);
    const totalDaysInPrevMonth = prevMonthDate.getDate();

    const cells = [];

    // 1. Fill previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        dayNumber: totalDaysInPrevMonth - i,
        date: new Date(currentYear, currentMonth - 1, totalDaysInPrevMonth - i),
        isCurrentMonth: false
      });
    }

    // 2. Fill current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      cells.push({
        dayNumber: i,
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true
      });
    }

    // 3. Fill next month days to complete grid (usually 42 cells total)
    const remainingCells = 42 - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push({
        dayNumber: i,
        date: new Date(currentYear, currentMonth + 1, i),
        isCurrentMonth: false
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-3 sm:p-5 select-none w-full bg-cordel-bg-light">
      {/* Grid Toolbar Controls */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-cordel-master-dark/15">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="text-xs font-black uppercase px-2.5 py-1 rounded border border-encre-noire bg-cordel-bg shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-100 cursor-pointer select-none"
        >
          ←
        </button>
        <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-cordel-wood font-serif capitalize">
          {monthName}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="text-xs font-black uppercase px-2.5 py-1 rounded border border-encre-noire bg-cordel-bg shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-100 cursor-pointer select-none"
        >
          →
        </button>
      </div>

      {/* Weekdays headers */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-cordel-wood mb-1.5">
        {weekdays.map(day => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid cells */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 bg-encre-noire/5 p-1 rounded">
        {calendarCells.map((cell, idx) => {
          const dateString = cell.date.toDateString();
          // Filter events matching this date
          const dayEvents = events.filter(e => {
            if (!e.date) return false;
            const eventDate = new Date(e.date);
            return eventDate.toDateString() === dateString;
          });

          const hasEvents = dayEvents.length > 0;
          const isToday = new Date().toDateString() === dateString;

          return (
            <div
              key={idx}
              className={`
                min-h-[55px] sm:min-h-[85px] p-1 flex flex-col justify-between rounded border transition-all relative
                ${cell.isCurrentMonth 
                  ? 'bg-cordel-bg border-encre-noire/15 text-encre-noire' 
                  : 'bg-white/30 dark:bg-black/10 border-dashed border-encre-noire/5 text-encre-noire/40'}
                ${isToday ? 'ring-2 ring-cordel-wood border-cordel-wood font-black z-10' : ''}
                ${hasEvents && cell.isCurrentMonth ? 'hover:shadow-[2px_2px_0px_0px_rgba(24,23,22,0.15)] hover:scale-[1.01]' : ''}
              `}
            >
              {/* Day number */}
              <div className="flex justify-between items-center select-none">
                <span className={`text-[9px] sm:text-[10px] font-bold ${isToday ? 'text-cordel-wood' : ''}`}>
                  {cell.dayNumber}
                </span>
                {isToday && (
                  <span className="text-[6px] sm:text-[7px] uppercase font-black tracking-wider text-cordel-wood border border-cordel-wood/30 px-1 rounded-sm leading-none bg-amber-50">
                    Auj.
                  </span>
                )}
              </div>

              {/* Day events content container */}
              <div className="flex flex-col gap-1 mt-1 justify-end flex-grow">
                {dayEvents.map(event => {
                  const variant = variants[event.type] || 'kraft';
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(event);
                      }}
                      className={`
                        w-full text-[7px] sm:text-[9px] font-bold text-left px-1.5 py-0.5 rounded-[3px_4px_2px_3px] border border-encre-noire/10 transition-transform hover:scale-[1.02] cursor-pointer leading-tight select-none
                        theme-bg-${variant}
                        ${event.status === 'annule' ? 'line-through opacity-50' : ''}
                        flex items-center gap-1
                      `}
                      title={`${event.titre} (${event.type})`}
                    >
                      {/* Dots representation on mobile, text block on desktop */}
                      <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-encre-noire/15 shrink-0 bg-white/40`} />
                      <span className="hidden sm:inline truncate">{event.titre}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </CordelCard>
  );
}
