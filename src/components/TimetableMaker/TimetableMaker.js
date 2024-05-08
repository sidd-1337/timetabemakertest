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
import AlertModal from "./AlertModal";
import './AlertModal.css';
import { SketchPicker } from 'react-color';
import { Wheel } from '@uiw/react-color';
import { hsvaToHex } from '@uiw/color-convert';
import { IoColorPalette } from "react-icons/io5";
import { Compact } from '@uiw/react-color';
export const days = ['Po', 'Út', 'St', 'Čt', 'Pá'];
export const dayKeys = days.map(day => `${day}`);

function TimetableMaker() {
    const location = useLocation();
    const { t,i18n  } = useTranslation();
    const { programme, faculty, typeOfStudy, formOfStudy, grade, semester } = location.state || {};
    const weekTypes = ['S', 'L', 'J', 'SL'];
    const weekTypeKeys = weekTypes.map(type => `weekType_${type}`);

    const days = ['Po', 'Út', 'St', 'Čt', 'Pá'];
    const dayKeys = days.map(day => `${day}`); // Translation keys
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
    const [showLoadingClock, setShowLoadingClock] = useState(false); // New state for clock symbol visibility
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [lectureColor, setLectureColor] = useState({ h: 0, s: 0, v: 100, a: 1 }); // Initial color for lectures
    const [tutorialColor, setTutorialColor] = useState({ h: 0, s: 0, v: 100, a: 1 }); // Initial color for tutorials
    const [showLectureColorPicker, setShowLectureColorPicker] = useState(false);
    const [showTutorialColorPicker, setShowTutorialColorPicker] = useState(false);
    const [showColorWheel, setShowColorWheel] = useState(false); // New state to toggle color wheel display
    const [isEditingDoneSubject, setIsEditingDoneSubject] = useState(false);

    const determineSlotColor = (slot, order) => {
        console.log(`Determining color for type: ${slot.type}`); // Debugging log
        if (!slot.subjectEvenWeek && !slot.subjectOddWeek && !slot.subjectBothWeeks && !slot.primarySubject && !slot.secondarySubject) return 'transparent';

        // Combine both active and done subjects for the search
        const combinedSubjects = [...subjects, ...doneSubjects];

        const subject = combinedSubjects.find(subj =>
            //subj.name === slot.subjectEvenWeek?.name ||
            //subj.name === slot.subjectOddWeek?.name ||
            //subj.name === slot.subjectBothWeeks?.name ||
            (subj.name === slot.primarySubject?.name && order === "Primary") ||
            (subj.name === slot.secondarySubject?.name && order === "Secondary")
        );

        if (!subject) return 'transparent'; // Return transparent if no subject is found
        var color="#FFFFFF";
        // Determine color based on the slot type (Lecture/Tutorial)
        if (order === "Primary")
            color = slot.primarySubject.type === 'Lecture' ? subject.colors.lectureColor : subject.colors.tutorialColor;
        else if(order === "Secondary")
            color = slot.secondarySubject.type === 'Lecture' ? subject.colors.lectureColor : subject.colors.tutorialColor;
        console.log(`Applied color: ${color}`); // Debugging log
        return color;
    };
    const handleLectureColorChange = (subjectId, color) => {
        const hexColor = color.hex;
        updateSubjectColor(subjectId, hexColor, 'Lecture');
    };

    const handleTutorialColorChange = (subjectId, color) => {
        const hexColor = color.hex;
        updateSubjectColor(subjectId, color, 'Tutorial');
    };
    const updateSubjectColorHSV = (subjectId, hsvColor, type) => {
        const hexColor = hsvaToHex(hsvColor);
        updateSubjectColor(subjectId, hexColor, type);
    };
    const updateSubjectColor = (subjectId, color, type) => {
        console.log(`Changing ${type} color: ${color}`);
        setSubjects(subjects => subjects.map(subj => {
            if (subj.id === subjectId) {
                const updatedColors = { ...subj.colors };
                if (type === 'Lecture') {
                    updatedColors.lectureColor = color;
                } else if (type === 'Tutorial') {
                    updatedColors.tutorialColor = color;
                }
                return { ...subj, colors: updatedColors };
            }
            return subj;
        }));
    };

    // Add state for the alert modal control
    const [alertInfo, setAlertInfo] = useState({
        isOpen: false,
        message: '',
        onKeepBoth: () => {},
        onOverwrite: () => {},
        onCancel: () => {}
    });

    useEffect(() => {
        // Whenever alertInfo.isOpen changes and if it's true, close the color pickers.
        if (alertInfo.isOpen) {
            setShowLectureColorPicker(false);
            setShowTutorialColorPicker(false);
        }
    }, [alertInfo.isOpen]);



    const handleKeepBoth = (subject, day, startIndex, endIndex, weekType) => {

        const updatedTimetable = timetable.map(daySchedule => {
            if (daySchedule.day !== day) return daySchedule;

            const updatedSlots = daySchedule.slots.map(((slot, index) => {

                // Check if the slot overlaps with the subject's time
                if (index >= startIndex && index <= endIndex) {
                    // Logic to combine or add the subject to this slot
                    let updatedSlot = { ...slot };
                    if (slot.primarySubject && (slot.primarySubject.weekType === 'S' || slot.primarySubject.weekType === 'L') && (weekType === 'S' || weekType === 'L') && slot.primarySubject.name === subject.name) {
                        updatedSlot.primarySubject = {
                            ...slot.primarySubject,
                            weekType: 'SL' // Combine week types
                        };
                    } else if (slot.secondarySubject && (slot.secondarySubject.weekType === 'S' || slot.secondarySubject.weekType === 'L') && slot.secondarySubject.name === subject.name){
                        updatedSlot.secondarySubject = {
                            ...slot.secondarySubject,
                            weekType: 'SL' // Combine week types
                        };
                    }
                    else if (!slot.primarySubject) {
                        updatedSlot.primarySubject = subject; // Add as primary if empty
                    } else if (!slot.secondarySubject) {
                        updatedSlot.secondarySubject = subject; // Add as secondary if primary is filled
                    }
                    return updatedSlot;
                }
                return slot;
            }));

            return { ...daySchedule, slots: updatedSlots };
        });

        setTimetable(updatedTimetable);
        setAlertInfo({ ...alertInfo, isOpen: false }); // Close the modal
    };




    const handleOverwrite = (newSubject, day, startIndex, endIndex, collisions) => {
        // Assuming `newSubject` has a unique identifier like `newSubject.id`
        // Step 1: Remove all instances of the subject from the timetable
        const cleanedTimetable = timetable.map(daySchedule => ({
            ...daySchedule,
            slots: daySchedule.slots.map(slot => {

                if (slot.primarySubject && slot.primarySubject.id === newSubject.id) {
                    // If the current slot's primarySubject is the one to be overwritten, clear it
                    return { ...slot, collisions, primarySubject: null };
                } else if (slot.secondarySubject && slot.secondarySubject.id === newSubject.id) {
                    // Same for secondarySubject
                    return { ...slot, collisions, secondarySubject: null};
                }
                return slot; // Return slot unchanged if it does not contain the subject to be overwritten
            })
        }));

        // Step 2: Insert the new subject into the specific day and slot range
        const updatedTimetable = cleanedTimetable.map(daySchedule => {
            if (daySchedule.day !== day) return daySchedule; // Skip days not affected

            const updatedSlots = daySchedule.slots.map((slot, index) => {
                if (index >= startIndex && index <= endIndex) {
                    // Only update slots within the specified range
                    return { ...slot, collisions, primarySubject: newSubject }; // Assign new subject to primarySubject
                }
                return slot;
            });

            return { ...daySchedule, slots: updatedSlots, collisions };
        });

        setTimetable(updatedTimetable);
        setAlertInfo({ isOpen: false }); // Assuming you want to close a modal or alert
    };



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
        let timer; // Declare a variable to hold the timeout
        setIsDataFetched(false); // Set to false when starting to fetch data
        setShowLoadingClock(false); // Initially, do not show the clock

        // Set a timer to show the clock symbol after 0.3 seconds
        timer = setTimeout(() => {
            setShowLoadingClock(true);
        }, 100); // 0.3 seconds delay


        console.log('Fetching data...');
        if(programme==="null" || faculty==="null" || typeOfStudy==="null" || formOfStudy==="null" || grade==="null" || semester==="null"){
            setIsDataFetched(true);
            setShowLoadingClock(false);
            clearTimeout(timer);
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
                        details: { lectures: [], tutorials: [] },
                        colors: { lectureColor: "#FFFFFF", tutorialColor: "#FFFFFF" }
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
            clearTimeout(timer);
            setIsDataFetched(true);
            setShowLoadingClock(false);
        } catch (error) {
            clearTimeout(timer);
            setIsDataFetched(true);
            setShowLoadingClock(false);
            console.error('Error fetching subject data:', error);
            const retry = window.confirm("Server Off. Would you like to retry?");
            if (retry) {
                fetchSubjectData();
            }
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



    const handleSubjectSelect = (subjectId, fromDoneSubjects = false) => {
        const subjectList = fromDoneSubjects ? doneSubjects : subjects;

        const subject = subjectList.find(subj => subj.id === subjectId);
        if (!subject) {
            console.error('Subject not found:', subjectId);
            return;
        }

        setIsEditingDoneSubject(fromDoneSubjects);
        setSelectedSubject(subject);
        setSubjectSchedule(subject.details);
        setSelectedLecture(null);
        setSelectedTutorial(null);
        confirmSubjectSelection(subject);
        setShowLectureColorPicker(false);
        setShowTutorialColorPicker(false);

        // Set colors
        const subjectLectureColor = subject.colors?.lectureColor || { h: 0, s: 0, v: 100, a: 1 };
        const subjectTutorialColor = subject.colors?.tutorialColor || { h: 0, s: 0, v: 100, a: 1 };
        setLectureColor(subjectLectureColor);
        setTutorialColor(subjectTutorialColor);
    };




    const handleConfirm = () => {
        if ((subjectSchedule.lectures.length > 0 && !selectedLecture) ||
            (subjectSchedule.tutorials.length > 0 && !selectedTutorial)) {
            alert(t('SelectBoth'));
            return;
        }

        // Update subject colors
        const updatedSubject = {
            ...selectedSubject,
            colors: {
                lectureColor: lectureColor,
                tutorialColor: tutorialColor
            }
        };

        if (isEditingDoneSubject) {
            setDoneSubjects(doneSubjects.map(subj => subj.id === updatedSubject.id ? updatedSubject : subj));
        } else {
            setDoneSubjects([...doneSubjects, updatedSubject]);
            setSubjects(subjects.filter((subj) => subj.id !== updatedSubject.id));
        }

        // Reset selected states
        setSelectedSubject(null);
        setSelectedLecture(null);
        setSelectedTutorial(null);
        setToConfirmSubject(null);
        setIsEditingDoneSubject(false);
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
            setSelectedLecture(null);
            setSelectedTutorial(null);
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
                primarySubject: null, // Initialize as null instead of an array
                secondarySubject: null, // Initialize as null instead of an array
            }))
        }));
        setTimetable(initialTimetable);
    };


    /*
    // Call initializeTimetable when the component mounts
    useEffect(() => {
        initializeTimetable();
    }, []);+
*/
    const timeToMinutes = (time) => {
        if (typeof time !== 'string' || !time.match(/^\d{2}:\d{2}$/)) {
            console.error(`Invalid time format: ${time}`);
            return 0; // Return a default value or consider throwing an error
        }

        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };


    // Function to add a lecture/tutorial to the timetable
    const addToTimetable = (id, subjectName, day, timeFrom, timeTo, type, department, shortName, building, room, teacher, weekType, isRestrictedTime = false) => {
        const daySchedule = timetable.find(d => d.day === day);
        if (!daySchedule) {
            console.error(`Day not found in timetable: ${day}`);
            return;
        }

        const collisions = checkForCollisions(subjectName, day, timeFrom, timeTo, weekType);

        const subject = {
            id,
            name: subjectName,
            type,
            department,
            shortName,
            building,
            room,
            teacher,
            weekType,
            isRestrictedTime
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
        const slotIsOccupied = daySchedule.slots.some(slot => {
            const slotStart = timeToMinutes(slot.timeFrom);
            const slotEnd = timeToMinutes(slot.timeTo);
            return startMinutes < slotEnd && endMinutes > slotStart && (slot.primarySubject !== null);
        });

        // Inside addToTimetable function
        if (slotIsOccupied) {
            // Assuming slotIsOccupied is a boolean indicating if the slot is already taken
            setAlertInfo({
                isOpen: true,
                message: t('TimeSlotOccupiedMessage'),
                onKeepBoth: () => handleKeepBoth(subject, day, startIndex, endIndex, weekType),
                onOverwrite: () => handleOverwrite(subject, day, startIndex, endIndex),
            });
            return; // Stop the function to wait for user input from the modal
        }

        const updatedTimetable = timetable.map(daySchedule => {
            if (daySchedule.day !== day) return daySchedule;

            const updatedSlots = daySchedule.slots.map((slot, index) => {
                if (index < startIndex || index > endIndex) return slot;

                if (isRestrictedTime) {
                    // Modify slot to indicate it's a restricted time
                    return { ...slot, primarySubject: { ...subject, isRestrictedTime: true }, collisions };
                }

                // Find if there's an existing subject in the slot for 'S' or 'L' week types
                let existingSLSubject = null;

                if (slot.primarySubject && (slot.primarySubject.weekType === 'S' || slot.primarySubject.weekType === 'L')) {
                    existingSLSubject = slot.primarySubject;
                } else if (slot.secondarySubject && (slot.secondarySubject.weekType === 'S' || slot.secondarySubject.weekType === 'L')) {
                    existingSLSubject = slot.secondarySubject;
                }

                // If adding 'S' or 'L' and the opposite week type is already present, combine them
                if ((weekType === 'S' || weekType === 'L') && existingSLSubject) {
                    const newWeekType = 'SL';
                    const updatedSubject = { ...existingSLSubject, weekType: newWeekType };
                    if (slot.primarySubject === existingSLSubject) {
                        return { ...slot, primarySubject: updatedSubject, collisions };
                    } else {
                        return { ...slot, secondarySubject: updatedSubject, collisions };
                    }
                }

                // For adding any new subject, the existing logic applies
                if (!slot.primarySubject) {
                    return { ...slot, primarySubject: subject, collisions };
                } else if (!slot.secondarySubject) {
                    return { ...slot, secondarySubject: subject, collisions };
                } else {
                    alert(t('BothSelected'));
                    return slot; // No changes, the slot is full
                }
            });
            return { ...daySchedule, slots: updatedSlots };
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
                    details: { lectures: [], tutorials: [], },
                    colors: { lectureColor: "#FFFFFF", tutorialColor: "#FFFFFF" }
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
            <h3>{t('ConfirmSelectionFor')} {subject.name}</h3>
            <button onClick={() => onConfirm(subject)}>{t('Yes')}✅</button>
            <button onClick={() => onReject()}>{t('No')}❌</button>
        </div>
    );
    const undoSubject = (subject) => {
        // Remove from doneSubjects and add back to subjects
        setDoneSubjects(doneSubjects.filter(sub => sub.id !== subject.id));
        setSubjects([...subjects, subject]);
        setTimetable(clearTimetable(subject));
    };

    const clearTimetable = (subject, collisions) => {
        return timetable.map(daySchedule => ({
            ...daySchedule,
            slots: daySchedule.slots.map(slot => {
                // Remove the subject from the slot if it matches the one being cleared
                const updatedSlot = {
                    ...slot, collisions,
                    primarySubject: slot.primarySubject && slot.primarySubject.name === subject.name ? null : slot.primarySubject,
                    secondarySubject: slot.secondarySubject && slot.secondarySubject.name === subject.name ? null : slot.secondarySubject,
                };

                // Recalculate collisions after removing the subject
                if (updatedSlot.collisions && updatedSlot.collisions.includes(subject.name)) {
                    updatedSlot.collisions = updatedSlot.collisions.filter(collidingSubject => collidingSubject !== subject.name);
                }

                // If there are no more collisions, remove the collisions array entirely
                if (updatedSlot.collisions && updatedSlot.collisions.length === 0) {
                    delete updatedSlot.collisions;
                }

                return updatedSlot;
            })
        }));
    };

    /* Function that removes "remove button" when subject is in "done subjects"
    const isSubjectDone = (subjectName) => {
        return doneSubjects.some(subject => subject.name === subjectName);
    };
    */
    const removeSpecificSession = (day, sessionType, id) => {
        setTimetable(prevTimetable => prevTimetable.map(daySchedule => {
            if (daySchedule.day !== day) return daySchedule; // Skip days that don't match

            return {
                ...daySchedule,
                slots: daySchedule.slots.map((slot, index) => {
                    let updatedSlot = { ...slot };

                    if (updatedSlot.primarySubject && updatedSlot.primarySubject.id === id && updatedSlot.primarySubject.type === sessionType) {
                        updatedSlot.primarySubject = null;
                    } else if (updatedSlot.secondarySubject && updatedSlot.secondarySubject.id === id && updatedSlot.secondarySubject.type === sessionType) {
                        updatedSlot.secondarySubject = null;
                    }

                    // Update collisions after removing the subject
                    updatedSlot.collisions = findCollisions(updatedSlot);

                    return updatedSlot;
                }),
            };
        }));
    };

// Helper function to find collisions for a specific slot
    const findCollisions = (slot) => {
        let collisions = [];

        if (slot.primarySubject) {
            collisions = timetable.flatMap(daySchedule =>
                daySchedule.slots.flatMap(slot =>
                    [slot.primarySubject, slot.secondarySubject].filter(Boolean)
                )
            ).filter(subject => subject.id !== slot.primarySubject.id); // Exclude current subject
        }

        if (slot.secondarySubject) {
            collisions = timetable.flatMap(daySchedule =>
                daySchedule.slots.flatMap(slot =>
                    [slot.primarySubject, slot.secondarySubject].filter(Boolean)
                )
            ).filter(subject => subject.id !== slot.secondarySubject.id); // Exclude current subject
        }

        return collisions.map(subject => subject.name);
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
                            <div className="day-header">{t(dayKeys[dayIndex])}</div>
                            {daySchedule.slots.slice(1).map((slot, timeIndex) => (
                                <div key={timeIndex} className="time-slot"
                                     title={slot.collisions?.length > 0 ? `${t('CollisionWith')} ${[...new Set(slot.collisions)].join(', ')}` : ''}
                                     >
                                    {slot.collisions?.length > 0 && (
                                        <div className={`collision-indicator ${slot.primarySubject && slot.secondarySubject && slot.primarySubject !== slot.secondarySubject ? 'full-occupancy' : ''}`}>
                                            !
                                        </div>
                                    )}
                                    {slot.primarySubject && (
                                        <>
                                        <div
                                            style={{
                                                backgroundColor: determineSlotColor(slot, "Primary"),
                                                borderRadius: "3px"
                                            }}>
                                            {(slot.primarySubject.name) && (
                                                <button className="remove-subject-button" title={t('RemoveSubject')}
                                                        onClick={() =>  removeSpecificSession(daySchedule.day, slot.primarySubject.type, slot.primarySubject.id)}
                                                >x
                                                </button>
                                            )}
                                            {slot.primarySubject.isRestrictedTime ? (
                                                <div className="restricted-time-name">
                                                    {slot.primarySubject.name}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="department-shortname">
                                                        {slot.primarySubject.department} / {slot.primarySubject.shortName}
                                                    </div>
                                                    <div className="building-room">
                                                        {slot.primarySubject.building} - {slot.primarySubject.room}
                                                    </div>
                                                    <div className="teacher-name">
                                                        {slot.primarySubject.teacher}
                                                    </div>
                                                    {slot.primarySubject.weekType && <div className="week-type">{t('Week')} {t(weekTypeKeys.find(key => key.includes(slot.primarySubject.weekType)))}</div>}
                                                </>
                                            )}
                                        </div>
                                        </>
                                    )}
                                    {slot.secondarySubject && (
                                        <>
                                        <div
                                            style={{
                                                backgroundColor: determineSlotColor(slot, "Secondary"),
                                                borderRadius: "3px"
                                            }}>
                                            <div className="slot-divider"></div>
                                            {(slot.secondarySubject.name) && (
                                                <button className="remove-subject-button" title={t('RemoveSubject')}
                                                        onClick={() => removeSpecificSession(daySchedule.day, slot.secondarySubject.type, slot.secondarySubject.id)}
                                                >x
                                                </button>
                                            )}
                                            {slot.secondarySubject.isRestrictedTime ? (
                                                <div className="restricted-time-name">
                                                    {slot.secondarySubject.name}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="department-shortname">
                                                        {slot.secondarySubject.department} / {slot.secondarySubject.shortName}
                                                    </div>
                                                    <div className="building-room">
                                                        {slot.secondarySubject.building} - {slot.secondarySubject.room}
                                                    </div>
                                                    <div className="teacher-name">
                                                        {slot.secondarySubject.teacher}
                                                    </div>
                                                    {slot.secondarySubject.weekType && <div className="week-type">{t('Week')} {t(weekTypeKeys.find(key => key.includes(slot.secondarySubject.weekType)))}</div>}
                                                </>
                                            )}
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
                        <h4>{t('Subjects')}</h4>
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
                        {showLoadingClock && (
                            <div className="loading-container"> {/* Container to center-align the clock and text */}

                                <div className="loading-clock"></div>
                                <div className="loading-text">{t('Loading')}</div>
                                {/* Text displayed under the clock */}
                            </div>
                        )}
                        <h3>{t('RestrictedTimes')}</h3>
                        {uniqueSessions(restrictedTimes).map(restricted => (
                            <div key={restricted.id} className="subject-item">
                                <button className='button'
                                        key={restricted.id}
                                        onClick={() => addToTimetable(restricted.id,restricted.name, restricted.day, restricted.timeFrom, restricted.timeTo, restricted.type, restricted.department, restricted.shortName, restricted.building, restricted.room, restricted.teacher, restricted.weekType, true)}>
                                    {restricted.name} {t(dayKeys.find(key => key.includes(restricted.day)))} {restricted.timeFrom} - {restricted.timeTo}
                                </button>

                                <button className="delete-button"
                                        onClick={() => deleteSubjectFromTimetable(restricted)}>❌
                                </button>
                            </div>))}
                    </div>

                    {selectedSubject && !isAlertOpen && (
                        <div className="subject-details">
                            <h4>{t('SubjectDetails')}</h4>
                            {subjectSchedule.lectures.length > 0 && (
                                <div className="lecture-section">
                                    <h4>{t('Lectures')}<IoColorPalette onClick={() => setShowLectureColorPicker(!showLectureColorPicker)} style={{ cursor: 'pointer' }} /></h4>
                                    {showLectureColorPicker && (
                                        <div className="color-picker-background">
                                        <div className="color-picker-combined-wrapper">
                                            <div className="compact-color-picker-wrapper" style={{ display: 'inline-block', transform: 'scale(0.8)', transformOrigin: 'top left' }}>
                                                <Compact
                                                    key={`compact-${selectedSubject.id}`}
                                                    color={lectureColor}
                                                    colors={['#FFFFFF', '#CCCCCC', '#ff7373','#ff4040', '#ffff66', '#fcea17', '#B8E986', '#96c961', '#b6fafc', '#73D8FF', '#FDA1FF','#f768e9', '#AEA1FF', '#7B64FF','#e6b795','#947259']}
                                                    onChange={(color) => {
                                                        const hexColor = hsvaToHex(color.hsva); // Convert HSV to Hex
                                                        setLectureColor(hexColor); // Update state with Hex color
                                                        updateSubjectColorHSV(selectedSubject.id, color.hsva, 'Lecture')
                                                    }}
                                                />
                                            </div>
                                            <div className="wheel-container" style={{ display: 'inline-block', verticalAlign: 'top',marginLeft:'-10px' }}>
                                                <Wheel
                                                    key={`wheel-${selectedSubject.id}`}
                                                    color={lectureColor}
                                                    onChange={(color) => {
                                                        setLectureColor(color.hsva);
                                                        if(selectedSubject) {
                                                            updateSubjectColorHSV(selectedSubject.id, color.hsva, 'Lecture');
                                                        }
                                                    }}
                                                    width={50} // Adjust the size as needed
                                                    height={50}
                                                />

                                            </div>
                                        </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {uniqueSessions(subjectSchedule.lectures).map(lecture => (
                                <button
                                    className={`button ${selectedLecture && selectedLecture.id === lecture.id ? 'selected' : ''}`}
                                    key={lecture.id}
                                    onClick={() => {
                                        selectSessionForConfirmation(lecture);
                                        addToTimetable(lecture.id, lecture.name, lecture.day, lecture.timeFrom, lecture.timeTo, lecture.type, lecture.department, lecture.shortName, lecture.building, lecture.room, lecture.teacher, lecture.weekType);
                                    }}
                                >
                                    {t(dayKeys.find(key => key.includes(lecture.day)))} <br/>  {lecture.timeFrom} - {lecture.timeTo} <br/> {lecture.teacher}
                                    <br/> {t('Week')} {t(weekTypeKeys.find(key => key.includes(lecture.weekType)))}
                                </button>
                            ))}

                            {subjectSchedule.tutorials.length > 0 && (
                                <div className="tutorial-section">
                                    <h4>{t('Tutorials')}<IoColorPalette onClick={() => setShowTutorialColorPicker(!showTutorialColorPicker)} style={{ cursor: 'pointer' }} /></h4>
                                    {showTutorialColorPicker && (
                                        <div className="color-picker-background">
                                        <div className="color-picker-combined-wrapper">
                                            <div className="compact-color-picker-wrapper" style={{ display: 'inline-block', transform: 'scale(0.8)', transformOrigin: 'top left' }}>
                                                <Compact
                                                    key={`compact-${selectedSubject.id}`}
                                                    color={tutorialColor}
                                                    colors={['#FFFFFF', '#CCCCCC', '#ff7373','#ff4040', '#ffff66', '#fcea17', '#B8E986', '#96c961', '#b6fafc', '#73D8FF', '#FDA1FF','#f768e9', '#AEA1FF', '#7B64FF','#e6b795','#947259']}
                                                    onChange={(color) => {
                                                        const hexColor = hsvaToHex(color.hsva); // Convert HSV to Hex
                                                        setTutorialColor(hexColor); // Update state with Hex color
                                                        updateSubjectColorHSV(selectedSubject.id, color.hsva, 'Tutorial')
                                                    }}
                                                />
                                            </div>
                                            <div className="wheel-container" style={{ display: 'inline-block', verticalAlign: 'top',marginLeft:'-10px' }}>
                                                <Wheel
                                                    key={`wheel-${selectedSubject.id}`}
                                                    color={tutorialColor}
                                                    onChange={(color) => {
                                                        setTutorialColor(color.hsva);
                                                        if(selectedSubject) {
                                                            updateSubjectColorHSV(selectedSubject.id, color.hsva, 'Tutorial');
                                                        }
                                                    }}
                                                    width={50} // Adjust the size as needed
                                                    height={50}
                                                />

                                            </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {uniqueSessions(subjectSchedule.tutorials).map(tutorial => (
                                <button
                                    className={`button ${selectedTutorial && selectedTutorial.id === tutorial.id ? 'selected' : ''}`}
                                    key={tutorial.id}
                                    onClick={() => {
                                        selectSessionForConfirmation(tutorial);
                                        addToTimetable(tutorial.id, tutorial.name, tutorial.day, tutorial.timeFrom, tutorial.timeTo, tutorial.type, tutorial.department, tutorial.shortName, tutorial.building, tutorial.room, tutorial.teacher, tutorial.weekType);
                                    }}
                                >
                                    {t(dayKeys.find(key => key.includes(tutorial.day)))} <br/> {tutorial.timeFrom} - {tutorial.timeTo} <br/> {tutorial.teacher}
                                    <br/> {t('Week')} {t(weekTypeKeys.find(key => key.includes(tutorial.weekType)))}
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
                        <h4>{t('DoneSubjects')}</h4>
                        {doneSubjects.map(subject => (
                            <div key={subject.id} className="subject-item">
                                <button className="button" onClick={() => handleSubjectSelect(subject.id, true)}>
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
                        {showSubjectLoader ? t('HideForm') : t('LoadSubjectStag')}
                    </button>
                </div>
                <div className="form-group">
                    {showSubjectLoader && <SubjectLoaderForm onSubjectAdded={handleSubjectAdded}/>}
                </div>
                <div className="buttons buttons-left">
                    <button className="custom-button" onClick={() => setShowRestrictedLoader(!showRestrictedLoader)}>
                        {showRestrictedLoader ? t('HideForm') : t('AddRestrictedTime')}
                    </button>
                    <button onClick={exportPDF} className="custom-button">{t('ExportAsPDF')}</button>
                </div>
                <div className="form-group">
                    {showRestrictedLoader &&
                        <RestrictedTimeForm  times={times} onAddSubject={handleAddSubject} />}
                </div>
            </div>
            <AlertModal
                isOpen={alertInfo.isOpen}
                message={alertInfo.message}
                onKeepBoth={alertInfo.onKeepBoth}
                onOverwrite={alertInfo.onOverwrite}
                onCancel={() => setAlertInfo({ ...alertInfo, isOpen: false })}
            />
        </>

    );
}


export default TimetableMaker;