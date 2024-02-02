import React, { useState, useEffect } from 'react';
import '../TableGenius/TableGenius.css'; // Reusing your existing CSS file
import './TimetableMaker.css';
import Header from '../Header';
import { useLocation } from 'react-router-dom';
import SubjectLoaderForm from './SubjectLoaderForm';
import { useTranslation } from 'react-i18next';



function TimetableMaker() {
    const location = useLocation();
    const { programme, faculty, typeOfStudy, formOfStudy, grade, semester } = location.state || {};

    const days = ['Po', 'Út', 'St', 'Čt', 'Pá'];
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
    const [subjects, setSubjects] = useState([]);
    const [showSubjectLoader, setShowSubjectLoader] = useState(false);

    const uniqueSessions = (sessions) => {
        return sessions.filter((session, index, self) =>
                index === self.findIndex((t) =>
                    t.day === session.day && t.timeFrom === session.timeFrom && t.timeTo === session.timeTo &&
                    t.type === session.type && t.department === session.department && t.shortName === session.shortName &&
                    t.building === session.building && t.room === session.room && t.teacher === session.teacher
                )
        );
    };
    const fetchSubjectData = async () => {
        if(programme==="null" || faculty==="null" || typeOfStudy==="null" || formOfStudy==="null" || grade==="null" || semester==="null"){
            return;
        }
        try {
            const response = await fetch(`/api/data/getOborId?nazevCZ=${programme}&fakultaOboru=${faculty}&typ=${typeOfStudy}&forma=${formOfStudy}&grade=${grade}&semester=${semester}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            const subjectsMap = new Map();
            data.forEach(item => {

                if (item.hodinaSkutOd.value === '00:00') {
                    return;
                }

                let subject = subjectsMap.get(item.nazev);
                if (!subject) {
                    subject = {
                        id: item.id,
                        name: item.nazev,
                        details: { lectures: [], tutorials: [] }
                    };
                    subjectsMap.set(item.nazev, subject);
                }
                const sessionDetails = {
                    id: item.id, // or some unique identifier
                    name: item.nazev,
                    day: days[days.indexOf(item.denZkr)], // Convert 'Po' to 'Monday', etc, if necessary
                    timeFrom: item.hodinaSkutOd.value,
                    timeTo: item.hodinaSkutDo.value,
                    department: item.katedra,
                    shortName: item.predmet,
                    type: item.typAkceZkr === 'Př' ? 'Lecture' : 'Tutorial',
                    building: item.budova,
                    room: item.mistnost,
                    teacher: item.ucitel && item.ucitel.prijmeni ? item.ucitel.prijmeni : 'Unknown',
                };
                if (item.typAkceZkr === 'Př') {
                    subject.details.lectures.push(sessionDetails);
                } else if (item.typAkceZkr === 'Cv') {
                    subject.details.tutorials.push(sessionDetails);
                }
            });
            setSubjects(Array.from(subjectsMap.values()));
        } catch (error) {
            console.error('Error fetching subject data:', error);
            alert("Server Off");
        }
    };

    useEffect(() => {
        if (programme && faculty && typeOfStudy && formOfStudy && grade && semester) {
            fetchSubjectData();
        } // Fetch subjects when component mounts
        initializeTimetable();
    }, [programme, faculty, typeOfStudy, formOfStudy, grade, semester]);

    const checkForCollisions = (newSubject, day, timeFrom, timeTo) => {
        const startMinutesNew = timeToMinutes(timeFrom);
        const endMinutesNew = timeToMinutes(timeTo);

        const collisions = subjects
            .filter(subject => subject.id !== newSubject.id) // Filtrujeme, aby se nezahrnul stejný předmět
            .flatMap(subject => subject.details.lectures.concat(subject.details.tutorials)) // Spojení přednášek a cvičení
            .filter(session => {
                if (session.day !== day) return false;
                const startMinutesSession = timeToMinutes(session.timeFrom);
                const endMinutesSession = timeToMinutes(session.timeTo);
                return (startMinutesSession < endMinutesNew && endMinutesSession > startMinutesNew); // Kontrola překrytí
            })
            .map(session => session.name);

        return collisions;
    };


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

        const collisions = checkForCollisions(selectedSubject, day, timeFrom, timeTo);

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
                            ? { ...slot, subject, collisions } // přidáme kolize do slotu
                            : slot
                    ),
                }
                : d
        );

        setTimetable(updatedTimetable);
    };

    const handleSubjectSelect = subjectId => {
        const subject = subjects.find(subj => subj.id === subjectId);
        if (!subject) {
            console.error('Subject not found:', subjectId);
            return;
        }
        setSelectedSubject(subject);
        setSubjectSchedule(subject.details);
    };

    const handleSubjectAdded = (subjectData) => {
        // Transform the received subject data to match the existing subjects structure
        const subjectsMap = new Map();
        subjectData.forEach(item => {
            if (item.hodinaSkutOd.value === '00:00') {
                return;
            }

            let subject = subjectsMap.get(item.nazev);
            if (!subject) {
                subject = {
                    id: item.id,
                    name: item.nazev,
                    details: { lectures: [], tutorials: [] }
                };
                subjectsMap.set(item.nazev, subject);
            }

            const sessionDetails = {
                id: item.id, // or some unique identifier
                name: item.nazev,
                day: days[days.indexOf(item.denZkr)], // Assuming 'days' array is available in this scope
                timeFrom: item.hodinaSkutOd.value,
                timeTo: item.hodinaSkutDo.value,
                department: item.katedra,
                shortName: item.predmet,
                type: item.typAkceZkr === 'Př' ? 'Lecture' : 'Tutorial',
                building: item.budova,
                room: item.mistnost,
                teacher: item.ucitel && item.ucitel.prijmeni ? item.ucitel.prijmeni : 'Unknown',
            };

            if (item.typAkceZkr === 'Př') {
                subject.details.lectures.push(sessionDetails);
            } else if (item.typAkceZkr === 'Cv') {
                subject.details.tutorials.push(sessionDetails);
            }
            });

        // Update the state with the new subjects list
        setSubjects(prevSubjects => {
            // Merge the new subjects into the existing subjects map
            const updatedSubjectsMap = new Map(prevSubjects.map(subj => [subj.name, subj]));

            subjectsMap.forEach((subj, name) => {
                updatedSubjectsMap.set(name, subj);
            });

            return Array.from(updatedSubjectsMap.values());
        });
    };




    return (
        <>
        <div className="container">
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
                            <div key={timeIndex} className="time-slot"
                                 title={slot.collisions?.length > 0 ? `Kolize s: ${[...new Set(slot.collisions)].join(', ')}` : ''}>
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
                                        {slot.collisions?.length > 0 &&
                                            <div className="collision-indicator">!</div>}
                                    </>
                                )}
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
            <div className="right-section">
                <div className="subject-selection">
                    {subjects.map(subject => (
                        <button className='button' key={subject.id} onClick={() => handleSubjectSelect(subject.id)}>
                            {subject.name}
                        </button>
                    ))}
                </div>


                {selectedSubject && (
                    <div className="subject-details">
                        <h4>Lectures</h4>
                        {uniqueSessions(subjectSchedule.lectures).map(lecture => (
                            <button className='button'
                                    key={lecture.id}
                                    onClick={() => addToTimetable(selectedSubject.name, lecture.day, lecture.timeFrom, lecture.timeTo, lecture.type, lecture.department, lecture.shortName, lecture.building, lecture.room, lecture.teacher)}>
                                {lecture.day} {lecture.timeFrom} - {lecture.timeTo} <br/> {lecture.teacher}
                            </button>
                        ))}

                        <h4>Tutorials</h4>
                        {uniqueSessions(subjectSchedule.tutorials).map(tutorial => (
                            <button className='button'
                                    key={tutorial.id}
                                    onClick={() => addToTimetable(selectedSubject.name, tutorial.day, tutorial.timeFrom, tutorial.timeTo, tutorial.type, tutorial.department, tutorial.shortName, tutorial.building, tutorial.room, tutorial.teacher)}>
                                {tutorial.day} {tutorial.timeFrom} - {tutorial.timeTo} <br/> {tutorial.teacher}
                            </button>
                        ))}
                    </div>
                )}</div>
            <div className="buttons buttons-left">
                <button className="custom-button"  onClick={() => setShowSubjectLoader(!showSubjectLoader)}>
                    {showSubjectLoader ? 'Hide Form' : 'Add New Subject'}
                </button>
            </div>
        <div className="form-group">
            {showSubjectLoader && <SubjectLoaderForm onSubjectAdded={handleSubjectAdded}/>}
        </div>
        </div>
</>

    );
}


export default TimetableMaker;