import React, { useState, useEffect } from 'react';
import '../TableGenius/TableGenius.css'; // Reusing your existing CSS file
import './TimetableMaker.css';
import Header from '../Header';

const mockSubjects = [
  {
    id: 1,
    name: 'Informační Systémy 1',
    lectures: [
      {
        id: 'inf-lecture-1',
        day: 'Monday',
        timeFrom: '9:10',
        timeTo: '10:45',
        department: 'KIP',
        shortName: '7INF1',
        type: 'lecture',
        building: 'C',
        room: '101',
        teacher: 'Žáček',
      },
      {
        id: 'inf-tutorial-2',
        day: 'Wednesday',
        timeFrom: '10:50',
        timeTo: '11:35',
        department: 'KIP',
        shortName: '7INF1',
        type: 'tutorial',
        building: 'C',
        room: '102',
        teacher: 'Žáček',
      },
    ],
  }, 
  {
    id: 2,
    name: 'Metody kódování, šifrování a bezpečnosti dat',
    lectures: [
      {
        id: 'kosb-lecture-1',
        day: 'Monday',
        timeFrom: '9:10',
        timeTo: '10:45',
        department: 'KIP',
        shortName: '7KOSB',
        type: 'lecture',
        building: 'C',
        room: '101',
        teacher: 'Zuzčák',
      },
      {
        id: 'kosb-tutorial-1',
        day: 'Thursday',
        timeFrom: '10:50',
        timeTo: '11:35',
        department: 'KIP',
        shortName: '7KOSB',
        type: 'tutorial',
        building: 'C',
        room: '102',
        teacher: 'Zuzčák',
      },
    ],
  },
  // Add more subjects with their details
];



function TimetableMaker() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  // Times can be an array of time slots, e.g., ['08:00', '09:00', ...]
  const times = [
    { from: '6:30', to: '7:15' },
    { from: '7:30', to: '08:15' },
    { from: '08:20', to: '09:05' },
    { from: '09:10', to: '09:55' },
    { from: '10:00', to: '10:45' },
    { from: '10:50', to: '11:35' },
    { from: '11:40', to: '12:25' },
    { from: '12:30', to: '13:15' },
    { from: '13:20', to: '14:05' },
    { from: '14:10', to: '14:55' },
    { from: '15:00', to: '15:45' },
    { from: '15:50', to: '16:35' },
    { from: '16:40', to: '17:25' },
    { from: '17:30', to: '18:15' },
    { from: '18:20', to: '19:05' },
    { from: '19:10', to: '19:55' },
    { from: '20:00', to: '20:45' },
  ];
  

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectSchedule, setSubjectSchedule] = useState({ lectures: [], tutorials: [] });
  const [timetable, setTimetable] = useState([]);
  
  const initializeTimetable = () => {
    const initialTimetable = days.map(day => ({
      day,
      slots: times.map(time => ({ timeFrom: time.from, timeTo: time.to, subject: null }))
    }));
    setTimetable(initialTimetable);
  };  

  // Call initializeTimetable when the component mounts
  useEffect(() => {
    initializeTimetable();
  }, []);

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Function to add a lecture/tutorial to the timetable
  const addToTimetable = (subjectName, day, timeFrom, timeTo, type, department, shortName, building, room, teacher) => {
    const daySchedule = timetable.find(d => d.day === day);
    if (!daySchedule) {
      console.error(`Day not found in timetable: ${day}`);
      return;
    }

    const subject = {
      name: subjectName,
      type,
      department,
      shortName,
      building,
      room,
      teacher
    };
  

  const startMinutes = timeToMinutes(timeFrom);
  const endMinutes = timeToMinutes(timeTo);

  const startIndex = daySchedule.slots.findIndex(slot => timeToMinutes(slot.timeFrom) === startMinutes);
  const endIndex = daySchedule.slots.findIndex(slot => timeToMinutes(slot.timeTo) === endMinutes);

  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
    alert('Invalid time range for the lecture/tutorial');
    return;
  }

  // Check if any of the slots in the range are already occupied
  let isOverwriting = false;
  for (let i = startIndex; i <= endIndex; i++) {
    if (daySchedule.slots[i].subject) {
      isOverwriting = true;
      break;
    }
  }

  // Confirm before overwriting
  if (isOverwriting) {
    const confirmOverwrite = window.confirm('This time slot is already occupied. Do you want to overwrite it?');
    if (!confirmOverwrite) {
      return; // Exit the function if the user chooses not to overwrite
    }
  }

  // Update the timetable
  const updatedTimetable = timetable.map(d =>
    d.day === day
      ? {
          ...d,
          slots: d.slots.map((slot, index) =>
            index >= startIndex && index <= endIndex
              ? { ...slot, subject } // assign the subject object here
              : slot
          ),
        }
      : d
  );

  setTimetable(updatedTimetable);
};
  
const handleSubjectSelect = subjectId => {
  const subject = mockSubjects.find(subj => subj.id === subjectId);
  setSelectedSubject(subject);

  const lectures = subject.lectures.filter(item => item.type === 'lecture');
  const tutorials = subject.lectures.filter(item => item.type === 'tutorial');

  setSubjectSchedule({
    lectures, // Only include items with type 'lecture'
    tutorials, // Only include items with type 'tutorial'
  });
};


  return (
    <><div className="container">
      <Header/>
      <div className="timetable-canvas">
       <div className="time-header">
       {times.slice(1).map((time, index) => (
  <div key={index} className="time-slot-header">{time.from} - {time.to}</div>
))}
  </div>
{timetable.map((daySchedule, dayIndex) => (
  <React.Fragment key={dayIndex}>
    <div className="day-header">{daySchedule.day}</div>
    {daySchedule.slots.slice(1).map((slot, timeIndex) => (
    <div key={timeIndex} className="time-slot">
      {slot.subject && (
        <>
          <div className="department-shortname">
            {slot.subject.department} / {slot.subject.shortName}
          </div>
          <div className="building-room">
            {slot.subject.building} - {slot.subject.room}
          </div>
          <div className="teacher-name">
            {slot.subject.teacher}
          </div>
        </>
      )}
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
        onClick={() => addToTimetable(selectedSubject.name, lecture.day, lecture.timeFrom, lecture.timeTo, lecture.type, lecture.department, lecture.shortName, lecture.building, lecture.room, lecture.teacher)}>
        {lecture.day} {lecture.timeFrom} - {lecture.timeTo}
      </button>
    ))}

    <h4>Tutorials</h4>
    {subjectSchedule.tutorials.map(tutorial => (
      <button className='button' 
      key={tutorial.id} onClick={() => addToTimetable(selectedSubject.name, tutorial.day, tutorial.timeFrom, tutorial.timeTo, tutorial.type, tutorial.department, tutorial.shortName, tutorial.building, tutorial.room, tutorial.teacher)}>
      {tutorial.day} {tutorial.timeFrom} - {tutorial.timeTo}
      </button>
    ))}
  </div>
)}</div>
</div></>

  );
}


export default TimetableMaker;
