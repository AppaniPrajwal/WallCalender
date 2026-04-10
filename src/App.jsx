import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Custom Dropdown Component to replace ugly native selects
const CustomDropdown = ({ options, value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`custom-dropdown ${className}`} ref={dropdownRef}>
      <div className="dropdown-selected" onClick={() => setIsOpen(!isOpen)}>
        <span>{options.find(opt => opt.value === value)?.label || value}</span>
        <span className="dropdown-arrow">&#9662;</span>
      </div>
      {isOpen && (
        <div className="dropdown-options">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`dropdown-option ${opt.value === value ? 'active' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


function App() {
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [dateRange, setDateRange] = useState([null, null]);
  const [currentNote, setCurrentNote] = useState('');

  const [savedNotes, setSavedNotes] = useState(() => {
    try {
      const stored = localStorage.getItem('calendarSavedNotesList');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSaveNotes = () => {
    if (!currentNote.trim()) return;

    // Determine what dates the user has currently highlighted on the calendar!
    let attachedDateLabel = "General Note";
    const [start, end] = dateRange;
    if (start && end) {
      attachedDateLabel = `${start} to ${end}`;
    } else if (start) {
      attachedDateLabel = `${start}`;
    }

    // Create new note object
    const newNote = {
      id: Date.now(),
      createdOn: new Date().toLocaleDateString(),
      targetDate: attachedDateLabel,
      text: currentNote
    };

    const updatedNotes = [newNote, ...savedNotes];
    setSavedNotes(updatedNotes);
    localStorage.setItem('calendarSavedNotesList', JSON.stringify(updatedNotes));

    // Clear area after saving
    setCurrentNote('');

    setSaveMessage('Saved!');
    setTimeout(() => {
      setSaveMessage('');
    }, 2000);
  };

  const handleDeleteNote = (id) => {
    const updatedNotes = savedNotes.filter(n => n.id !== id);
    setSavedNotes(updatedNotes);
    localStorage.setItem('calendarSavedNotesList', JSON.stringify(updatedNotes));
  };


  const weekdays = [
    { name: 'MON', type: 'weekday-text' },
    { name: 'TUE', type: 'weekday-text' },
    { name: 'WED', type: 'weekday-text' },
    { name: 'THU', type: 'weekday-text' },
    { name: 'FRI', type: 'weekday-text' },
    { name: 'SAT', type: 'weekend' },
    { name: 'SUN', type: 'weekend' },
  ];

  const formatDateString = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendarData = () => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();

    let firstDayIndex = new Date(year, month, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const daysInCurrentMonth = getDaysInMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    const dates = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const pDay = daysInPrevMonth - i;
      dates.push({
        num: pDay,
        type: 'other-month',
        isCurrentMonth: false,
        fullDate: formatDateString(year, month - 1, pDay),
      });
    }

    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const dayOfWeek = (firstDayIndex + i - 1) % 7;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      dates.push({
        num: i,
        type: isWeekend ? 'current weekend' : 'current',
        isCurrentMonth: true,
        fullDate: formatDateString(year, month, i),
      });
    }

    const remainingCells = 42 - dates.length;
    for (let i = 1; i <= remainingCells; i++) {
      dates.push({
        num: i,
        type: 'other-month',
        isCurrentMonth: false,
        fullDate: formatDateString(year, month + 1, i),
      });
    }
    return dates;
  };

  const datesData = generateCalendarData();

  const handleDateClick = (fullDate, isCurrentMonth) => {
    if (!isCurrentMonth) return;
    const [start, end] = dateRange;

    if (start !== null && end !== null) {
      setDateRange([fullDate, null]);
    } else if (start !== null && end === null) {
      if (fullDate === start) {
        setDateRange([null, null]);
      } else if (fullDate < start) {
        setDateRange([fullDate, start]);
      } else {
        setDateRange([start, fullDate]);
      }
    } else {
      setDateRange([fullDate, null]);
    }
  };

  const getSelectionClass = (fullDate) => {
    const [start, end] = dateRange;
    if (start === fullDate && end === fullDate) return 'selected-start selected-end';
    if (start === fullDate) return 'selected-start';
    if (end === fullDate) return 'selected-end';
    if (start !== null && end !== null && fullDate > start && fullDate < end) {
      return 'selected-between';
    }
    return '';
  };

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  const yearOptions = Array.from({ length: 2100 - 1950 + 1 }, (_, i) => {
    return { label: String(1950 + i), value: 1950 + i };
  });

  const monthOptions = monthNames.map((m, idx) => {
    return { label: m, value: idx };
  });

  // Simple Twin-Loop generator as originally approved
  const renderTwinLoops = (count) => {
    return Array.from({ length: count }).map((_, i) => (
      <div key={i} className="twin-loop"></div>
    ));
  };

  return (
    <div className="calendar-wrapper">
      <div className="spirals">
        <div className="loops-left">
          {renderTwinLoops(12)}
        </div>

        <div className="spiral-hanger">
          {/* Wall Nail */}
          <div className="wall-nail"></div>
          {/* Hanger Wire Hook */}
          <svg viewBox="0 0 50 40" className="hanger-wire">
            <path
              d="M-10,25 L15,25 C18,25 21,5 25,5 C29,5 32,25 35,25 L60,25"
              fill="none"
              stroke="#333"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="loops-right">
          {renderTwinLoops(12)}
        </div>
      </div>

      <div className="calendar-page">
        <div className="header-section">
          <img src="/climber.png" alt="Mountain Climber" className="header-image" />
          <div className="blue-shape"></div>

          <div className="month-year-container">
            <div className="year-control">
              <CustomDropdown
                className="year-picker"
                options={yearOptions}
                value={currentViewDate.getFullYear()}
                onChange={(newYear) => {
                  setCurrentViewDate(prev => {
                    const newDate = new Date(prev);
                    newDate.setFullYear(newYear);
                    return newDate;
                  });
                }}
              />
            </div>

            <div className="month-control">
              <CustomDropdown
                className="month-picker"
                options={monthOptions}
                value={currentViewDate.getMonth()}
                onChange={(newMonth) => {
                  setCurrentViewDate(prev => {
                    const newDate = new Date(prev);
                    newDate.setMonth(newMonth);
                    return newDate;
                  });
                }}
              />
            </div>
          </div>
        </div>

        <div className="content-section">
          <div className="notes-container">
            <h3 className="notes-title">
              {(() => {
                const [start, end] = dateRange;
                if (start && end) return `Notes for ${start} to ${end}`;
                if (start) return `Notes for ${start}`;
                return "General Notes";
              })()}
            </h3>
            <textarea
              className="notes-textarea"
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Type your notes..."
            />
            <div className="notes-actions">
              <button className="save-button" onClick={handleSaveNotes}>Save</button>
              <button className="view-notes-button" onClick={() => setIsModalOpen(true)}>
                Saved Notes ({savedNotes.length})
              </button>
              {saveMessage && <span className="save-message">{saveMessage}</span>}
            </div>
          </div>

          <div className="calendar-grid-container">
            <div className="calendar-grid">
              {weekdays.map((day, idx) => (
                <div key={idx} className={`weekday ${day.type}`}>
                  {day.name}
                </div>
              ))}

              {datesData.map((date, idx) => {
                const isSelectedClass = getSelectionClass(date.fullDate);
                return (
                  <div
                    key={idx}
                    className={`date-cell ${isSelectedClass}`}
                    onClick={() => handleDateClick(date.fullDate, date.isCurrentMonth)}
                  >
                    <div className={`date-number ${date.type} ${!date.isCurrentMonth ? 'disabled' : ''}`}>
                      {date.num}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Saved Notes</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {savedNotes.length === 0 ? (
                <p className="no-notes-msg">You have no saved notes yet.</p>
              ) : (
                savedNotes.map(note => (
                  <div key={note.id} className="saved-note-item">
                    <div className="note-meta">
                      <span className="note-date">
                        {note.targetDate !== "General Note" ? (
                          <span style={{ color: '#178eca' }}>{note.targetDate}</span>
                        ) : (
                          <span>{note.targetDate}</span>
                        )}
                        <span style={{ opacity: 0.6, marginLeft: '10px', fontSize: '0.75rem' }}>Logged: {note.createdOn}</span>
                      </span>
                      <button className="delete-note-btn" onClick={() => handleDeleteNote(note.id)}>Delete</button>
                    </div>
                    <p className="note-text">{note.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
