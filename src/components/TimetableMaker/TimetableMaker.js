import React, {useEffect, useRef, useState} from 'react';
import '../TableGenius/TableGenius.css'; // Reusing your existing CSS file
import './TimetableMaker.css';
import Header from '../Header';
import {useLocation} from 'react-router-dom';
import SubjectLoaderForm from './SubjectLoaderForm';


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
    const [isDataFetched, setIsDataFetched] = useState(false);
    const initialized = useRef(false);

    const uniqueSessions = (sessions) => {
        return sessions.filter((session, index, self) =>
                index === self.findIndex((t) =>
                    t.day === session.day && t.timeFrom === session.timeFrom && t.timeTo === session.timeTo &&
                    t.type === session.type && t.department === session.department && t.shortName === session.shortName &&
                    t.building === session.building && t.room === session.room && t.teacher === session.teacher && t.weekType === session.weekType
                )
        );
    };
    const fetchSubjectData = async () => {
        console.log('Fetching data...');
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
                    weekType: item.tydenZkr,
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
        if (programme && faculty && typeOfStudy && formOfStudy && grade && semester && !initialized.current) {
            fetchSubjectData();
            console.log('Useeffect...');
            initialized.current = true;// Set the flag so data isn't fetched again
        }
        initializeTimetable();
    }, [programme, faculty, typeOfStudy, formOfStudy, grade, semester]);

    const checkForCollisions = (newSubject, day, timeFrom, timeTo, weekType) => {
        const startMinutesNew = timeToMinutes(timeFrom);
        const endMinutesNew = timeToMinutes(timeTo);


        const collisions = subjects
            .filter(subject => subject.id !== newSubject.id)
            .flatMap(subject => subject.details.lectures.concat(subject.details.tutorials))
            .filter(session => {
                // Zkontrolujte, že session není pro stejný předmět
                if (session.id === newSubject.id) return false;

                // Zkontrolujte, že se jedná o stejný den
                if (session.day !== day) return false;

                // Zkontrolujte, že se jedná o stejný nebo "J" weekType
                const isWeekTypeCompatible = (weekType === "J" || session.weekType === "J" || weekType === session.weekType);
                if (!isWeekTypeCompatible) return false;

                // Zkontrolujte, že se jedná o časový překryv
                const startMinutesSession = timeToMinutes(session.timeFrom);
                const endMinutesSession = timeToMinutes(session.timeTo);
                return (startMinutesSession < endMinutesNew && endMinutesSession > startMinutesNew);
            })
            .map(session => session.name);
        return collisions;
    };


    const initializeTimetable = () => {
        const initialTimetable = days.map(day => ({
            day,
            slots: times.map(time => ({
                timeFrom: time.from,
                timeTo: time.to,
                subjectEvenWeek: null,
                subjectOddWeek: null,
                subjectBothWeeks: null,
            }))
        }));
        setTimetable(initialTimetable);
    };


    /*
    // Call initializeTimetable when the component mounts
    useEffect(() => {
        initializeTimetable();
    }, []);
*/
    const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Function to add a lecture/tutorial to the timetable
    const addToTimetable = (subjectName, day, timeFrom, timeTo, type, department, shortName, building, room, teacher, weekType) => {
        const daySchedule = timetable.find(d => d.day === day);
        if (!daySchedule) {
            console.error(`Day not found in timetable: ${day}`);
            return;
        }

        const collisions = checkForCollisions(selectedSubject, day, timeFrom, timeTo, weekType);

        const subject = {
            name: subjectName,
            type,
            department,
            shortName,
            building,
            room,
            teacher,
            weekType
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
            if (daySchedule.slots[i].subjectBothWeeks || daySchedule.slots[i].subjectEvenWeek && daySchedule.slots[i].subjectOddWeek ) {
                isOverwriting = true;
                break;
            }
        }


        if (isOverwriting) {
            const confirmOverwrite = window.confirm('This time slot is already occupied. Do you want to overwrite it?');
            if (!confirmOverwrite) {
                return; // Exit the function if the user chooses not to overwrite
            }
        }

        const updatedTimetable = timetable.map(daySchedule => {
            if (daySchedule.day !== day) return daySchedule;

            return {
                ...daySchedule,
                slots: daySchedule.slots.map((slot, index) => {
                    if (index < startIndex || index > endIndex) return slot;

                    let updatedSlot = {...slot, collisions};

                    if (weekType === 'J') {
                        updatedSlot.subjectEvenWeek = null; // Odstranění, pokud byly dříve přidány
                        updatedSlot.subjectOddWeek = null;
                        updatedSlot.subjectBothWeeks = subject;
                    } else {
                        if (weekType === 'S') {
                            updatedSlot.subjectEvenWeek = subject;
                            // Pokud je "L" již obsazeno, "J" je odstraněno
                            updatedSlot.subjectBothWeeks = null;
                        } else if (weekType === 'L') {
                            updatedSlot.subjectOddWeek = subject;
                            // Pokud je "S" již obsazeno, "J" je odstraněno
                            updatedSlot.subjectBothWeeks = null;
                        }
                    }

                    return updatedSlot;
                }),
            };
        });

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
                weekType: item.tydenZkr,
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
                                    {slot.collisions?.length > 0 &&
                                        <div className="collision-indicator">!</div>}
                                    {slot.subjectEvenWeek && (
                                        <>
                                            <div className="department-shortname">
                                                {slot.subjectEvenWeek.department} / {slot.subjectEvenWeek.shortName}
                                            </div>
                                            <div className="building-room">
                                                {slot.subjectEvenWeek.building} - {slot.subjectEvenWeek.room}
                                            </div>
                                            <div className="teacher-name">
                                                {slot.subjectEvenWeek.teacher}
                                            </div>
                                            <div className="even-week">Týden:Sudý</div>
                                            <div className="even-week">-----</div>
                                            </>
                                    )}{slot.subjectOddWeek && (
                                        <>
                                            <div className="department-shortname">
                                                {slot.subjectOddWeek.department} / {slot.subjectOddWeek.shortName}
                                            </div>
                                            <div className="building-room">
                                                {slot.subjectOddWeek.building} - {slot.subjectOddWeek.room}
                                            </div>
                                            <div className="teacher-name">
                                                {slot.subjectOddWeek.teacher}
                                            </div>
                                            <div className="odd-week">Týden:Lichý</div>
                                        </>
                                )}{slot.subjectBothWeeks && (
                                        <>
                                            <div className="department-shortname">
                                                {slot.subjectBothWeeks.department} / {slot.subjectBothWeeks.shortName}
                                            </div>
                                            <div className="building-room">
                                                {slot.subjectBothWeeks.building} - {slot.subjectBothWeeks.room}
                                            </div>
                                            <div className="teacher-name">
                                                {slot.subjectBothWeeks.teacher}
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
                                        onClick={() => addToTimetable(selectedSubject.name, lecture.day, lecture.timeFrom, lecture.timeTo, lecture.type, lecture.department, lecture.shortName, lecture.building, lecture.room, lecture.teacher, lecture.weekType)}>
                                    {lecture.day} {lecture.timeFrom} - {lecture.timeTo} <br/> {lecture.teacher} <br/> Week: {lecture.weekType}
                                </button>
                            ))}

                            <h4>Tutorials</h4>
                            {uniqueSessions(subjectSchedule.tutorials).map(tutorial => (
                                <button className='button'
                                        key={tutorial.id}
                                        onClick={() => addToTimetable(selectedSubject.name, tutorial.day, tutorial.timeFrom, tutorial.timeTo, tutorial.type, tutorial.department, tutorial.shortName, tutorial.building, tutorial.room, tutorial.teacher, tutorial.weekType)}>
                                    {tutorial.day} {tutorial.timeFrom} - {tutorial.timeTo} <br/> {tutorial.teacher} <br/> Week: {tutorial.weekType}
                                </button>
                            ))}
                        </div>
                    )}</div>
                <div className="buttons buttons-left">
                    <button className="custom-button"  onClick={() => setShowSubjectLoader(!showSubjectLoader)}>
                        {showSubjectLoader ? 'Hide Form' : 'Load subject from STAG'}
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