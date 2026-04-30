// ============================= KALENDARZ ===========================
window.openVisualizationModal = async function() {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  if (!window.selectedBillboardForSchedule) {
    window.showToast(t.selectBillboardFirst, "error");
    return;
  }
  
  if (window.visualizationModal) {
    window.visualizationModal.style.display = "flex";
  }
  
  if (window.visualizationBillboardName) {
    window.visualizationBillboardName.textContent = window.currentVisualizationBillboardName;
  }
  
  const now = new Date();
  window.currentCalendarMonth = now.getMonth();
  window.currentCalendarYear = now.getFullYear();
  window.selectedCalendarDay = window.formatDayKey(now);
  
  if (window.calendarContainer) {
    window.calendarContainer.innerHTML = `<p>${t.loading}</p>`;
  }
  
  try {
    const res = await fetch(`/api/schedules/${window.selectedBillboardForSchedule}?page=1&limit=1000`, {
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    if (!data.success || !data.schedules || data.schedules.length === 0) {
      if (window.calendarContainer) {
        window.calendarContainer.innerHTML = `
          <div class="no-schedules-message" style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 10px; color: var(--text-secondary);">📅</div>
            <p style="font-size: 16px; color: var(--text-secondary);">${t.noSchedulesFound}</p>
          </div>
        `;
      }
      return;
    }
    
    window.calendarSchedulesData = window.processSchedulesForCalendar(data.schedules);
    window.renderCalendar();
    
  } catch (err) {
    console.error("Błąd ładowania harmonogramów do wizualizacji:", err);
    if (window.calendarContainer) {
      window.calendarContainer.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 10px; color: var(--danger);">❌</div>
          <p style="font-size: 16px; color: var(--text); margin-bottom: 10px;">${t.errorLoading}</p>
          <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
            ${err.message}
          </p>
          <button onclick="window.openVisualizationModal()" class="tile-btn" style="margin-top: 10px;">
            ${t.retryBtn || 'Try again'}
          </button>
        </div>
      `;
    }
  }
}

window.processSchedulesForCalendar = function(schedules) {
  const scheduleByDay = {};
  
  schedules.forEach(schedule => {
    if (schedule.status !== 'active') {
      return;
    }
    
    const startDate = new Date(schedule.start_date);
    const endDate = new Date(schedule.end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Nieprawidłowe daty dla harmonogramu:', schedule.id);
      return;
    }
    
    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const dayDiff = Math.round((endDay - startDay) / (1000 * 60 * 60 * 24));
    const isMultiDay = dayDiff > 0;
    
    let repeatDays = [];
    try {
      if (schedule.repeat) {
        if (typeof schedule.repeat === 'string') {
          repeatDays = JSON.parse(schedule.repeat);
        } else {
          repeatDays = schedule.repeat;
        }
        
        if (!Array.isArray(repeatDays)) {
          repeatDays = [1,2,3,4,5,6,7];
        } else {
          repeatDays = repeatDays.filter(day => Number.isInteger(day) && day >= 1 && day <= 7);
          if (repeatDays.length === 0) {
            repeatDays = [1,2,3,4,5,6,7];
          }
        }
      } else {
        repeatDays = [1,2,3,4,5,6,7];
      }
    } catch (e) {
      console.error('Błąd parsowania repeat dla harmonogramu:', schedule.id, e);
      repeatDays = [1,2,3,4,5,6,7];
    }
    
    let currentDate = new Date(startDay);
    const finalEndDate = new Date(endDay);
    
    while (currentDate <= finalEndDate) {
      const dayOfWeek = currentDate.getDay();
      const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
      
      if (repeatDays.includes(isoDayOfWeek)) {
        const dayKey = window.formatDayKey(currentDate);
        
        if (!scheduleByDay[dayKey]) {
          scheduleByDay[dayKey] = {};
        }
        
        const scheduleKey = schedule.task_name + "_" + JSON.stringify(schedule.content);
        
        if (!scheduleByDay[dayKey][scheduleKey]) {
          scheduleByDay[dayKey][scheduleKey] = {
            id: schedule.id,
            name: schedule.task_name,
            timeSlots: [],
            original_start_date: schedule.start_date,
            original_end_date: schedule.end_date,
            content: schedule.content,
            billboard_uuid: schedule.billboard_uuid,
            status: schedule.status,
            is_multi_day: isMultiDay,
            day_count: dayDiff + 1,
            repeat: repeatDays
          };
        }
        
        const occurrenceStartDate = new Date(currentDate);
        occurrenceStartDate.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds());
        
        const occurrenceEndDate = new Date(currentDate);
        occurrenceEndDate.setHours(endDate.getHours(), endDate.getMinutes(), endDate.getSeconds());
        
        if (endDate > startDate) {
          const hourDiff = (endDate - startDate) / (1000 * 60 * 60);
          occurrenceEndDate.setTime(occurrenceStartDate.getTime() + (hourDiff * 60 * 60 * 1000));
        }
        
        scheduleByDay[dayKey][scheduleKey].timeSlots.push({
          start: occurrenceStartDate,
          end: occurrenceEndDate
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });
  
  const groupedByDay = {};
  
  Object.keys(scheduleByDay).forEach(dayKey => {
    groupedByDay[dayKey] = [];
    
    Object.values(scheduleByDay[dayKey]).forEach(schedule => {
      const timeSlots = schedule.timeSlots.sort((a, b) => a.start - b.start);
      const mergedSlots = [];
      
      timeSlots.forEach(slot => {
        mergedSlots.push({ start: slot.start, end: slot.end });
      });
      
      if (mergedSlots.length > 0) {
        const earliestStart = new Date(Math.min(...mergedSlots.map(s => s.start.getTime())));
        const latestEnd = new Date(Math.max(...mergedSlots.map(s => s.end.getTime())));
        
        groupedByDay[dayKey].push({
          id: schedule.id,
          name: schedule.name,
          start_date: earliestStart.toISOString(),
          end_date: latestEnd.toISOString(),
          time_slots: mergedSlots,
          original_start_date: schedule.original_start_date,
          original_end_date: schedule.original_end_date,
          content: schedule.content,
          billboard_uuid: schedule.billboard_uuid,
          status: schedule.status,
          is_multi_day: schedule.is_multi_day,
          day_count: schedule.day_count,
          repeat: schedule.repeat,
          has_multiple_slots: mergedSlots.length > 1
        });
      }
    });
  });
  
  return groupedByDay;
};

window.renderCalendar = function() {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const monthNames = [
    t.calendarMonthJanuary, t.calendarMonthFebruary, t.calendarMonthMarch,
    t.calendarMonthApril, t.calendarMonthMay, t.calendarMonthJune,
    t.calendarMonthJuly, t.calendarMonthAugust, t.calendarMonthSeptember,
    t.calendarMonthOctober, t.calendarMonthNovember, t.calendarMonthDecember
  ];
  
  const weekdays = [
    t.calendarWeekdayMon, t.calendarWeekdayTue, t.calendarWeekdayWed,
    t.calendarWeekdayThu, t.calendarWeekdayFri, t.calendarWeekdaySat,
    t.calendarWeekdaySun
  ];
  
  const today = new Date();
  const currentMonth = window.currentCalendarMonth;
  const currentYear = window.currentCalendarYear;
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  
  let firstDayOfWeek = firstDayOfMonth.getDay();
  if (firstDayOfWeek === 0) firstDayOfWeek = 6;
  else firstDayOfWeek--;
  
  const daysInMonth = lastDayOfMonth.getDate();
  
  let calendarHTML = `
    <div class="calendar-header">
      <div class="calendar-nav">
        <button class="calendar-nav-btn" id="calendarPrevMonth">⬅ ${t.calendarPrevMonth}</button>
        <button class="calendar-nav-btn" id="calendarToday">${t.calendarToday}</button>
        <button class="calendar-nav-btn" id="calendarNextMonth">${t.calendarNextMonth} ➡</button>
      </div>
      <div class="calendar-month-year">${monthNames[currentMonth]} ${currentYear}</div>
    </div>
    
    <div class="calendar-grid">
  `;
  
  weekdays.forEach(day => {
    calendarHTML += `<div class="calendar-weekday">${day}</div>`;
  });
  
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarHTML += `<div class="calendar-day empty"></div>`;
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dayKey = window.formatDayKey(date);
    const schedulesForDay = window.calendarSchedulesData[dayKey] || [];
    const scheduleCount = schedulesForDay.length;
    
    const isToday = today.getDate() === day && 
                    today.getMonth() === currentMonth && 
                    today.getFullYear() === currentYear;
    
    const isSelected = window.selectedCalendarDay === dayKey;
    
    let dayClass = "calendar-day";
    if (isToday) dayClass += " today";
    if (isSelected) dayClass += " selected";
    if (scheduleCount > 0) dayClass += " has-schedules";
    
    calendarHTML += `
      <div class="${dayClass}" data-day="${dayKey}">
        <div class="day-number">${day}</div>
        ${scheduleCount > 0 ? `
          <div class="day-badge">${scheduleCount}</div>
          <div class="day-schedule-count">${scheduleCount} ${scheduleCount === 1 ? t.scheduleSingle : t.schedulePlural}</div>
        ` : ''}
      </div>
    `;
  }
  
  calendarHTML += `</div>`;
  
  calendarHTML += `
    <div class="calendar-legends">
      <div class="calendar-legend">
        <div class="legend-color today"></div>
        <span>${t.calendarTodayLegend}</span>
      </div>
      <div class="calendar-legend">
        <div class="legend-color selected"></div>
        <span>${t.calendarSelectedLegend}</span>
      </div>
      <div class="calendar-legend">
        <div class="legend-color has-schedules"></div>
        <span>${t.calendarHasSchedulesLegend}</span>
      </div>
    </div>
  `;
  
  if (window.selectedCalendarDay) {
    const selectedSchedules = window.calendarSchedulesData[window.selectedCalendarDay] || [];
    
    calendarHTML += `
      <div class="calendar-schedule-details">
        <h4>${t.calendarSchedulesForDay} ${window.formatDayKeyToDDMMYYYY(window.selectedCalendarDay)}</h4>
        ${selectedSchedules.length > 0 ? `
          <div class="calendar-schedule-list">
            ${selectedSchedules.map(schedule => {
              let filename = '';
              let fileType = 'image';
              let thumbnailUrl = '';
              
              try {
                let contentObj = schedule.content;
                if (typeof schedule.content === 'string') {
                  contentObj = JSON.parse(schedule.content);
                }
                
                filename = contentObj.filename || '';
                fileType = contentObj.type || 'image';
                
                if (filename && schedule.billboard_uuid) {
                  thumbnailUrl = `/api/billboard/${schedule.billboard_uuid}/file/${encodeURIComponent(filename)}`;
                }
              } catch (e) {
                console.error('Błąd parsowania content:', e);
              }
              
              const isMultiDaySchedule = schedule.is_multi_day || false;
              const dayDiff = schedule.day_count || 1;
              
              const formatDateToDDMMYYYY = (date) => {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}-${month}-${year}`;
              };
              
              const formatTime = (date) => {
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${hours}:${minutes}`;
              };
              
              const formatDateToDDMM = (date) => {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                return `${day}.${month}`;
              };
              
              const originalStartDate = new Date(schedule.original_start_date || schedule.start_date);
              const originalEndDate = new Date(schedule.original_end_date || schedule.end_date);
              const originalStartFormatted = formatDateToDDMM(originalStartDate);
              const originalEndFormatted = formatDateToDDMM(originalEndDate);
              const originalDayDiff = Math.round((originalEndDate - originalStartDate) / (1000 * 60 * 60 * 24)) + 1;
              
              let dayInfoHTML = '';
              if (isMultiDaySchedule) {
                dayInfoHTML = `<span class="multi-day-info">🔄 ${originalDayDiff} ${originalDayDiff === 1 ? t.daySingle : t.daysPlural || 'dni'} (${originalStartFormatted} - ${originalEndFormatted})</span>`;
              }
              
              let repeatInfoHTML = '';
              if (schedule.repeat && Array.isArray(schedule.repeat) && schedule.repeat.length < 7) {
                repeatInfoHTML = `<div class="calendar-schedule-repeat">🔄 ${window.getRepeatLabel(schedule.repeat, lang)}</div>`;
              }
              
              let timeSlotsHTML = '';
              
              const dateRangeStart = formatDateToDDMMYYYY(originalStartDate);
              const dateRangeEnd = formatDateToDDMMYYYY(originalEndDate);
              
              const dateRangeStr = dateRangeStart === dateRangeEnd 
                ? `📅 ${dateRangeStart}`
                : `📅 ${dateRangeStart} → 📅 ${dateRangeEnd}`;
              
              if (schedule.has_multiple_slots && schedule.time_slots && schedule.time_slots.length > 1) {
                const timeSlotsString = schedule.time_slots.map(slot => {
                  const start = new Date(slot.start);
                  const end = new Date(slot.end);
                  const startTime = formatTime(start);
                  const endTime = formatTime(end);
                  return `${startTime} - ${endTime}`;
                }).join(', ');
                
                timeSlotsHTML = `
                  <div class="calendar-schedule-time">
                    <div class="time-line">
                      <span class="time-label">${t.calendarDateLabel || 'Data:'}</span>
                      <span class="time-value">${dateRangeStr}</span>
                    </div>
                    <div class="time-line">
                      <span class="time-label">${t.calendarHoursLabel || 'Godziny:'}</span>
                      <span class="time-value compact-times">${timeSlotsString}</span>
                    </div>
                  </div>
                `;
              } else {
                const firstSlot = schedule.time_slots ? schedule.time_slots[0] : null;
                if (firstSlot) {
                  const startTime = formatTime(firstSlot.start);
                  const endTime = formatTime(firstSlot.end);
                  timeSlotsHTML = `
                    <div class="calendar-schedule-time">
                      <div class="time-line">
                        <span class="time-label">${t.calendarDateLabel || 'Data:'}</span>
                        <span class="time-value">${dateRangeStr}</span>
                      </div>
                      <div class="time-line">
                        <span class="time-label">${t.calendarHoursLabel || 'Godziny:'}</span>
                        <span class="time-value">${startTime} - ${endTime}</span>
                      </div>
                    </div>
                  `;
                }
              }
              
              // Wykrywanie typu pliku
              const fname = filename ? filename.toLowerCase() : '';
              const isVideo = fileType === 'video' ||
                              fname.endsWith('.mp4') || fname.endsWith('.webm') ||
                              fname.endsWith('.avi') || fname.endsWith('.mov') ||
                              fname.endsWith('.mkv') || fname.endsWith('.ogg');
              const isPdf = fileType === 'pdf' || fname.endsWith('.pdf');
              const isZip = fileType === 'zip' || fname.endsWith('.zip');
              const isJs  = fileType === 'js'  || fname.endsWith('.js');

              // Blok miniatury
              let thumbnailBlock;
              if (!filename || !thumbnailUrl) {
                thumbnailBlock = `
                  <div class="calendar-schedule-thumbnail no-thumbnail">
                    <div class="no-thumbnail-icon">📄</div>
                  </div>
                `;
              } else if (isVideo) {
                thumbnailBlock = `
                  <div class="calendar-schedule-thumbnail">
                    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--background);">
                      <div style="font-size: 24px; color: var(--text-secondary); margin-bottom: 5px;">🎬</div>
                      <div style="font-size: 10px; color: var(--text-secondary); text-align: center; padding: 0 5px;">${window.truncateFilename(filename, 15)}</div>
                      <button onclick="window.openVideoInNewTab('${thumbnailUrl}'); event.stopPropagation();"
                              style="margin-top: 5px; background: var(--primary); color: white; border: none; border-radius: 4px; padding: 3px 8px; font-size: 10px; cursor: pointer;">
                        ▶ ${t.videoPlayBtn}
                      </button>
                    </div>
                    <div class="thumbnail-type video">🎬</div>
                  </div>
                `;
              } else if (isPdf) {
                thumbnailBlock = `
                  <div class="calendar-schedule-thumbnail">
                    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--background);">
                      <div style="font-size: 28px; margin-bottom: 4px;">📄</div>
                      <div style="font-size: 10px; font-weight: 700; letter-spacing: 1px; color: var(--text-secondary);">PDF</div>
                    </div>
                    <div class="thumbnail-type pdf">📄</div>
                  </div>
                `;
              } else if (isZip) {
                thumbnailBlock = `
                  <div class="calendar-schedule-thumbnail">
                    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--background);">
                      <div style="font-size: 28px; margin-bottom: 4px;">🗜️</div>
                      <div style="font-size: 10px; font-weight: 700; letter-spacing: 1px; color: var(--text-secondary);">ZIP</div>
                    </div>
                    <div class="thumbnail-type zip">🗜️</div>
                  </div>
                `;
              } else if (isJs) {
                thumbnailBlock = `
                  <div class="calendar-schedule-thumbnail">
                    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--background);">
                      <div style="font-size: 28px; margin-bottom: 4px;">📜</div>
                      <div style="font-size: 10px; font-weight: 700; letter-spacing: 1px; color: var(--text-secondary);">JS</div>
                    </div>
                    <div class="thumbnail-type js">📜</div>
                  </div>
                `;
              } else {
                thumbnailBlock = `
                  <div class="calendar-schedule-thumbnail">
                    <img src="${thumbnailUrl}"
                         alt="${filename}"
                         class="schedule-thumbnail-img"
                         onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div style=\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;\'>🖼️</div>';">
                    <div class="thumbnail-type image">🖼️</div>
                  </div>
                `;
              }
              
              return `
                <div class="calendar-schedule-item">
                  <div class="calendar-schedule-content">
                    ${thumbnailBlock}
                    
                    <div class="calendar-schedule-info">
                      <div class="calendar-schedule-name">
                        ${schedule.name}
                        ${dayInfoHTML}
                      </div>
                      ${filename ? `
                        <div class="calendar-schedule-filename" title="${filename}">
                          <small>📁 ${window.truncateFilename(filename, 30)}</small>
                        </div>
                      ` : ''}
                      ${timeSlotsHTML}
                      ${repeatInfoHTML}
                    </div>
                  </div>
                  <div class="calendar-schedule-status status-${schedule.status}">
                    ${window.getStatusLabel(schedule.status, lang)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="no-schedules-day">
            ${t.calendarNoSchedulesForDay}
          </div>
        `}
      </div>
    `;
  }
  
  if (window.calendarContainer) {
    window.calendarContainer.innerHTML = calendarHTML;
  }
  
  const prevMonthBtn = document.getElementById('calendarPrevMonth');
  const nextMonthBtn = document.getElementById('calendarNextMonth');
  const todayBtn = document.getElementById('calendarToday');
  
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      window.currentCalendarMonth--;
      if (window.currentCalendarMonth < 0) {
        window.currentCalendarMonth = 11;
        window.currentCalendarYear--;
      }
      window.renderCalendar();
    });
  }
  
  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      window.currentCalendarMonth++;
      if (window.currentCalendarMonth > 11) {
        window.currentCalendarMonth = 0;
        window.currentCalendarYear++;
      }
      window.renderCalendar();
    });
  }
  
  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      const now = new Date();
      window.currentCalendarMonth = now.getMonth();
      window.currentCalendarYear = now.getFullYear();
      window.selectedCalendarDay = window.formatDayKey(now);
      window.renderCalendar();
    });
  }
  
  const dayElements = document.querySelectorAll('.calendar-day:not(.empty)');
  dayElements.forEach(dayElement => {
    dayElement.addEventListener('click', () => {
      const dayKey = dayElement.dataset.day;
      window.selectedCalendarDay = window.selectedCalendarDay === dayKey ? null : dayKey;
      window.renderCalendar();
      
      if (window.selectedCalendarDay) {
        setTimeout(() => {
          const detailsElement = document.querySelector('.calendar-schedule-details');
          if (detailsElement) {
            detailsElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);
      }
    });
  });
};

window.formatDayKey = function(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

window.formatDayKeyToDDMMYYYY = function(dayKey) {
  const parts = dayKey.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
  }
  return dayKey;
};

document.addEventListener('DOMContentLoaded', function() {
  if (window.visualizeBtn && window.visualizeBtn._clickListenerAdded) {
    window.visualizeBtn.removeEventListener("click", window.visualizeBtn._clickListener);
  }
  
  const clickHandler = async () => {
    if (!window.selectedBillboardForSchedule) {
      const lang = window.getCookie("language") || "pl";
      const t = window.translations[lang];
      window.showToast(t.selectBillboardFirst, "error");
      return;
    }
    
    await window.openVisualizationModal();
  };
  
  if (window.visualizeBtn) {
    window.visualizeBtn._clickListener = clickHandler;
    window.visualizeBtn._clickListenerAdded = true;
    window.visualizeBtn.addEventListener("click", clickHandler);
  }
});