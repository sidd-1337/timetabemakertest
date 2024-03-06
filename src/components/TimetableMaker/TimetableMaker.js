import React, {useEffect, useRef, useState} from 'react';
import '../TableGenius/TableGenius.css'; // Reusing your existing CSS file
import './TimetableMaker.css';
import Header from '../Header';
import {useLocation} from 'react-router-dom';
import SubjectLoaderForm from './SubjectLoaderForm';
import RestrictedTimeForm from "./RestrictedTimeForm";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useTranslation } from 'react-i18next';



function TimetableMaker() {
    const location = useLocation();
    const { programme, faculty, typeOfStudy, formOfStudy, grade, semester } = location.state || {};

    const days = ['Po', 'Út', 'St', 'Čt', 'Pá'];
    // Times can be an array of time slots, e.g., ['08:00', '09:00', ...]
    const times = [
        { from: '', to: '' },
        { from: '06:30', to: '07:15' },
        { from: '07:30', to: '08:15' },
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
    const [subjectSchedule, setSubjectSchedule] = useState({ lectures: [], tutorials: [], });
    const [timetable, setTimetable] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [showSubjectLoader, setShowSubjectLoader] = useState(false);
    const [showRestrictedLoader, setShowRestrictedLoader] = useState(false);
    const [restrictedTimes, setRestrictedTimes] = useState([]);
    const [isDataFetched, setIsDataFetched] = useState(false);
    const initialized = useRef(false);
    const [toConfirmSubject, setToConfirmSubject] = useState(null);
    const [doneSubjects, setDoneSubjects] = useState([]);
    const [selectedLecture, setSelectedLecture] = useState(null);
    const [selectedTutorial, setSelectedTutorial] = useState(null);


    const uniqueSessions = (sessions) => {
        return sessions.filter((session, index, self) =>
                index === self.findIndex((t) =>
                    t.day === session.day && t.timeFrom === session.timeFrom && t.timeTo === session.timeTo &&
                    t.type === session.type && t.department === session.department && t.shortName === session.shortName &&
                    t.building === session.building && t.room === session.room && t.teacher === session.teacher && t.weekType === session.weekType
                )
        );
    };
    const exportPDF = () => {
        const body = document.body;
        body.classList.add('pdf-export'); // Add class to hide collision indicators

        const input = document.querySelector('.timetable-canvas'); // The element to capture
        if (!input) return;

        html2canvas(input, { scale: 2 }).then(originalCanvas => {
            body.classList.remove('pdf-export'); // Remove class after capturing

            // Your existing PDF generation logic...
            const originalWidth = originalCanvas.width;
            const originalHeight = originalCanvas.height;
            const padding = 40;
            const rotatedWidth = originalHeight + (padding * 2);
            const rotatedHeight = originalWidth + (padding * 2);
            const rotatedCanvas = document.createElement('canvas');
            rotatedCanvas.width = rotatedWidth;
            rotatedCanvas.height = rotatedHeight;
            const context = rotatedCanvas.getContext('2d');
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, rotatedWidth, rotatedHeight);
            context.translate(rotatedWidth / 2, rotatedHeight / 2);
            context.rotate(90 * Math.PI / 180);
            context.drawImage(originalCanvas, -originalWidth / 2, -originalHeight / 2);
            const a4Width = 595;
            const a4Height = 842;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: [a4Width, a4Height]
            });
            const scaleX = a4Width / rotatedWidth;
            const scaleY = a4Height / rotatedHeight;
            const scale = Math.min(scaleX, scaleY);
            const scaledWidth = rotatedWidth * scale;
            const scaledHeight = rotatedHeight * scale;
            const xPosition = (a4Width - scaledWidth) / 2;
            const yPosition = (a4Height - scaledHeight) / 2;
            const imgData = rotatedCanvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', xPosition, yPosition, scaledWidth, scaledHeight);
            pdf.save('timetable.pdf');
        }).catch(err => {
            console.error('Error exporting PDF:', err);
            body.classList.remove('pdf-export'); // Ensure the class is removed even if there's an error
        });
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

        // Kontrola kolizí mezi předměty
        const subjectCollisions = subjects
            .filter(subject => subject.name !== newSubject)
            .flatMap(subject => subject.details.lectures.concat(subject.details.tutorials))
            .filter(session => {
                if (session.name === newSubject) return false;
                if (session.day !== day) return false;
                const startMinutesSession = timeToMinutes(session.timeFrom);
                const endMinutesSession = timeToMinutes(session.timeTo);
                return (startMinutesSession < endMinutesNew && endMinutesSession > startMinutesNew);
            })
            .map(session => session.name);

        // Kontrola kolizí s restricted times
        const restrictedTimeCollisions = restrictedTimes
            .filter(restrictedTime => {
                if (restrictedTime.name === newSubject) return false;
                if (restrictedTime.day !== day) return false;
                const startMinutesRestricted = timeToMinutes(restrictedTime.timeFrom);
                const endMinutesRestricted = timeToMinutes(restrictedTime.timeTo);
                return (startMinutesRestricted < endMinutesNew && endMinutesRestricted > startMinutesNew);
            })
            .map(restrictedTime => restrictedTime.name);

        // Sloučení kolizí z obou zdrojů
        return [...subjectCollisions, ...restrictedTimeCollisions];
    };

    const selectSessionForConfirmation = (session) => {
        if (session.type === 'Lecture') {
            setSelectedLecture((prevSelectedLecture) =>
                prevSelectedLecture && prevSelectedLecture.id === session.id ? null : session
            );
        } else if (session.type === 'Tutorial') {
            setSelectedTutorial((prevSelectedTutorial) =>
                prevSelectedTutorial && prevSelectedTutorial.id === session.id ? null : session
            );
        }
    };


    // Function to select a lecture/tutorial for confirmation
    const confirmSubjectSelection = (subject, sessionType) => {
        setToConfirmSubject({ ...subject, sessionType });
    };



    const handleSubjectSelect = subjectId => {
        // If the selected subject is clicked again, deselect it
        if (selectedSubject && selectedSubject.id === subjectId) {
            setSelectedSubject(null);
            setSubjectSchedule({ lectures: [], tutorials: [] }); // Reset subject schedule
        } else {
            // Find and select the new subject
            const subject = subjects.find(subj => subj.id === subjectId);
            if (!subject) {
                console.error('Subject not found:', subjectId);
                return;
            }
            setSelectedSubject(subject);
            setSubjectSchedule(subject.details);
            setSelectedLecture(null);
            setSelectedTutorial(null);
            confirmSubjectSelection(subject);
        }
    };


    const handleConfirm = () => {
        // Make sure we have a selected lecture and/or tutorial if they are required
        if (
            (subjectSchedule.lectures.length > 0 && !selectedLecture) ||
            (subjectSchedule.tutorials.length > 0 && !selectedTutorial)
        ) {
            alert("You must select both a lecture and a tutorial if they are available.");
            return;
        }
        // Confirm the selection and add to doneSubjects
        setDoneSubjects([...doneSubjects, selectedSubject]);
        // Remove from current subjects list
        setSubjects(subjects.filter((subj) => subj.id !== selectedSubject.id));
        // Reset the selected subject and the selected sessions for confirmation
        setSelectedSubject(null);
        setSelectedLecture(null);
        setSelectedTutorial(null);
        // Reset the confirmation subject
        setToConfirmSubject(null);
    };


    const handleReject = () => {
        if (selectedSubject) {
            setTimetable(clearTimetable(selectedSubject));
            setSelectedLecture(null);
            setSelectedTutorial(null);
        }

    };

    const deleteSubjectFromTimetable = (subject) => {
        // Directly filter subjects and restricted times without intermediate constants
        setSubjects(subjects.filter(sub => sub.id !== subject.id));
        setRestrictedTimes(restrictedTimes.filter(rt => rt.id !== subject.id));

        // Use a single loop to clear slots, improving readability and performance
        setTimetable(clearTimetable(subject));

        // Reset the selected subject and its schedule if the deleted subject was the selected one
        if (selectedSubject && selectedSubject.id === subject.id) {
            setSelectedSubject(null);
            setSubjectSchedule({ lectures: [], tutorials: [] });
        }
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
                restricted:null,
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

        const collisions = checkForCollisions(subjectName, day, timeFrom, timeTo, weekType);

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
            if (daySchedule.slots[i].subjectBothWeeks || daySchedule.slots[i].subjectEvenWeek && daySchedule.slots[i].subjectOddWeek || daySchedule.slots[i].restricted) {
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
                        updatedSlot.restricted = null;
                        updatedSlot.subjectBothWeeks = subject;
                    } else {
                        if (weekType === 'S') {
                            updatedSlot.subjectEvenWeek = subject;
                            // Pokud je "L" již obsazeno, "J" je odstraněno
                            updatedSlot.subjectBothWeeks = null;
                            updatedSlot.restricted = null;
                        } else if (weekType === 'L') {
                            updatedSlot.subjectOddWeek = subject;
                            // Pokud je "S" již obsazeno, "J" je odstraněno
                            updatedSlot.subjectBothWeeks = null;
                            updatedSlot.restricted = null;
                        } else if (restrictedTimes){
                            updatedSlot.restricted = subject;
                            updatedSlot.subjectEvenWeek = null;
                            updatedSlot.subjectOddWeek = null;
                            updatedSlot.subjectBothWeeks = null;
                        }

                    }

                    return updatedSlot;
                }),
            };
        });

        setTimetable(updatedTimetable);



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
                    details: { lectures: [], tutorials: [], }
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
    const handleAddSubject = (subjectData) => {
        const id = Date.now();
        console.log("Adding restricted time with ID:", id);
        console.log("Adding restricted time with ID:", subjectData.name);
        setRestrictedTimes(currentTimes => [
            ...currentTimes,
            { ...subjectData, id }// Adding an ID for uniqueness
        ]);
    };


    const ConfirmSubjectSelection = ({ onConfirm, onReject, subject }) => (
        <div>
            <h3>Confirm selection for {subject.name}</h3>
            <button onClick={() => onConfirm(subject)}>YES ✅</button>
            <button onClick={() => onReject()}>NO ❌</button>
        </div>
    );
    const undoSubject = (subject) => {
        // Remove from doneSubjects and add back to subjects
        setDoneSubjects(doneSubjects.filter(sub => sub.id !== subject.id));
        setSubjects([...subjects, subject]);
        setTimetable(clearTimetable(subject));
    };

    const clearTimetable= (subject) => {
        return timetable.map(daySchedule => ({
            ...daySchedule,
            slots: daySchedule.slots.map(slot => {
                // Check if slot contains the subject to be deleted
                const isSlotRelatedToSubject = [slot.subjectBothWeeks, slot.subjectOddWeek, slot.subjectEvenWeek, slot.restricted]
                    .some(s => s && s.name === subject.name);

                // Clear the slot if related to the subject being deleted
                if (isSlotRelatedToSubject) {
                    return { ...slot, subjectBothWeeks: null, subjectOddWeek: null, subjectEvenWeek: null, restricted: null };
                }

                return slot; // Return the slot unchanged if not related to the subject
            })
        }));
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
                                )}{slot.restricted && (
                                    <>
                                        <div className="department-shortname">
                                            {slot.restricted.name}
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
                            <div key={subject.id} className="subject-item">
                                <button className='button' key={subject.id}
                                        onClick={() => handleSubjectSelect(subject.id)}>
                                    {subject.name}
                                </button>
                                <button className="delete-button"
                                        onClick={() => deleteSubjectFromTimetable(subject)}>❌
                                </button>

                            </div>
                        ))}
                        <h3>Restricted Times</h3>
                        {uniqueSessions(restrictedTimes).map(restricted => (
                            <div key={restricted.id} className="subject-item">
                                <button className='button'
                                        key={restricted.id}
                                        onClick={() => addToTimetable(restricted.name, restricted.day, restricted.timeFrom, restricted.timeTo)}>
                                    {restricted.name} {restricted.day} {restricted.timeFrom} - {restricted.timeTo}

                                </button>


                                <button className="delete-button"
                                        onClick={() => deleteSubjectFromTimetable(restricted)}>❌
                                </button>
                            </div>))}
                    </div>

                    {selectedSubject && (
                        <div className="subject-details">
                            <h4>Lectures</h4>
                            {uniqueSessions(subjectSchedule.lectures).map(lecture => (
                                <button
                                    className={`button ${selectedLecture && selectedLecture.id === lecture.id ? 'selected' : ''}`}
                                    key={lecture.id}
                                    onClick={() => {
                                        selectSessionForConfirmation(lecture);
                                        addToTimetable(lecture.name, lecture.day, lecture.timeFrom, lecture.timeTo, lecture.type, lecture.department, lecture.shortName, lecture.building, lecture.room, lecture.teacher, lecture.weekType);
                                    }}
                                >
                                    {lecture.day} {lecture.timeFrom} - {lecture.timeTo} <br/> {lecture.teacher}
                                    <br/> Week: {lecture.weekType}
                                </button>
                            ))}

                            <h4>Tutorials</h4>
                            {uniqueSessions(subjectSchedule.tutorials).map(tutorial => (
                                <button
                                    className={`button ${selectedTutorial && selectedTutorial.id === tutorial.id ? 'selected' : ''}`}
                                    key={tutorial.id}
                                    onClick={() => {
                                        selectSessionForConfirmation(tutorial);
                                        addToTimetable(tutorial.name, tutorial.day, tutorial.timeFrom, tutorial.timeTo, tutorial.type, tutorial.department, tutorial.shortName, tutorial.building, tutorial.room, tutorial.teacher, tutorial.weekType);
                                    }}
                                >
                                    {tutorial.day} {tutorial.timeFrom} - {tutorial.timeTo} <br/> {tutorial.teacher}
                                    <br/> Week: {tutorial.weekType}
                                </button>
                            ))}

                            {toConfirmSubject && (
                                <ConfirmSubjectSelection
                                    subject={toConfirmSubject}
                                    onConfirm={handleConfirm}
                                    onReject={handleReject}
                                />
                            )}


                        </div>

                    )}

                    <div className="done-subjects">
                        {doneSubjects.map(subject => (
                            <div key={subject.id} className="subject-item">
                                <button className="button">
                                    {subject.name}
                                </button>
                                <button className="undo-button" onClick={() => undoSubject(subject)}>
                                    ↩️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>


                <div className="buttons buttons-left">
                    <button className="custom-button" onClick={() => setShowSubjectLoader(!showSubjectLoader)}>
                        {showSubjectLoader ? 'Hide Form' : 'Load subject from STAG'}
                    </button>
                </div>
                <div className="form-group">
                    {showSubjectLoader && <SubjectLoaderForm onSubjectAdded={handleSubjectAdded}/>}
                </div>
                <div className="buttons buttons-left">
                    <button className="custom-button" onClick={() => setShowRestrictedLoader(!showRestrictedLoader)}>
                        {showRestrictedLoader ? 'Hide Form' : 'Add restricted time'}
                    </button>
                    <button onClick={exportPDF} className="custom-button">Export as PDF</button>
                </div>
                <div className="form-group">
                    {showRestrictedLoader &&
                        <RestrictedTimeForm days={days} times={times} onAddSubject={handleAddSubject}/>}
                </div>
            </div>
        </>

    );
}


export default TimetableMaker;