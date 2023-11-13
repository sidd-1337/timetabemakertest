import React, { useState, useEffect } from 'react';
import '../TableGenius/TableGenius.css'; // Reusing your existing CSS file
import './TimetableMaker.css';

const mockSubjects = [
  {
    id: 1,
    name: 'Mathematics',
    lectures: [
      { id: 'math-lecture-1', day: 'Monday', time: '10:00-11:00' },
      { id: 'math-lecture-2', day: 'Wednesday', time: '12:00-13:00' },
    ],
    tutorials: [
      { id: 'math-tutorial-1', day: 'Tuesday', time: '14:00-15:00' },
      { id: 'math-tutorial-2', day: 'Thursday', time: '16:00-17:00' },
    ],
  },

  {
    id: 2,
    name: 'Physics',
    lectures: [
      { id: 'math-lecture-1', day: 'Tuesday', time: '10:00-11:00' },
    ],
    tutorials: [
      { id: 'math-tutorial-1', day: 'Tuesday', time: '14:00-15:00' },
      { id: 'math-tutorial-2', day: 'Thursday', time: '16:00-17:00' },
    ],
  },
  // ... add more subjects as needed
];


function TimetableMaker() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  // Times can be an array of time slots, e.g., ['08:00', '09:00', ...]
  const times = [' ','09:00- 10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00']; // Example times

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectSchedule, setSubjectSchedule] = useState({ lectures: [], tutorials: [] });
  const [timetable, setTimetable] = useState([]);
  
  const initializeTimetable = () => {
    const initialTimetable = days.map(day => ({
      day,
      slots: times.map(time => ({ time, subject: null }))
    }));
    setTimetable(initialTimetable);
  };

  // Call initializeTimetable when the component mounts
  useEffect(() => {
    initializeTimetable();
  }, []);

  // Function to add a lecture/tutorial to the timetable
  const addToTimetable = (subjectName, day, time) => {
    // Check if the time slot is already occupied
    const daySchedule = timetable.find(d => d.day === day);

  if (!daySchedule) {
    console.error(`Day not found in timetable: ${day}`);
    return; // Exit the function if the day is not found
  }

  const timeSlot = daySchedule.slots.find(slot => slot.time === time);

  if (timeSlot && timeSlot.subject) {
    alert('This time slot is already occupied!');
    return;
  }
    // Update the timetable with the new subject
    const updatedTimetable = timetable.map(d => 
      d.day === day 
        ? { ...d, slots: d.slots.map(slot => 
            slot.time === time 
              ? { ...slot, subject: subjectName }
              : slot
          ) 
        }
        : d
    );

    setTimetable(updatedTimetable);
  };

  // Function to handle subject selection
  const handleSubjectSelect = subjectId => {
    const subject = mockSubjects.find(subj => subj.id === subjectId);
    setSelectedSubject(subject);
    setSubjectSchedule({ lectures: subject.lectures, tutorials: subject.tutorials });
  };

  return (
    <><div className="container">
      <div className="timetable-canvas">
       <div className="time-header">
       {times.slice(1).map((time, index) => ( // Skip the first empty string in times
        <div key={index} className="time-slot-header">{time}</div>
      ))}
  </div>
  {timetable.map((daySchedule, dayIndex) => (
      <React.Fragment key={dayIndex}>
        <div className="day-header">{daySchedule.day}</div>
        {daySchedule.slots.slice(1).map((slot, timeIndex) => ( // Skip the first slot as it's aligned with day header
          <div key={timeIndex} className="time-slot">
            {slot.subject && <div className="subject-name">{slot.subject}</div>}
          </div>
        ))}
      </React.Fragment>
    ))}
    </div>
    <div className="right-section">
    <div className="subject-selection">
        {mockSubjects.map(subject => (
          <button className='button' key={subject.id}  onClick={() => handleSubjectSelect(subject.id)}>
            {subject.name}
          </button>
        ))}
      </div>
      
      

  {selectedSubject && (
  <div className="subject-details">
    <h4>Lectures</h4>
    {subjectSchedule.lectures.map(lecture => (
      <button className='button' 
        key={lecture.id} 
        onClick={() => addToTimetable(selectedSubject.name, lecture.day, lecture.time)}>
        {lecture.day} {lecture.time}
      </button>
    ))}

    <h4>Tutorials</h4>
    {subjectSchedule.tutorials.map(tutorial => (
      <button key={tutorial.id} onClick={() => addToTimetable(selectedSubject.name, tutorial.day, tutorial.time)}>
        {tutorial.day} {tutorial.time}
      </button>
    ))}
  </div>
)}</div>
</div></>

  );
}


export default TimetableMaker;
