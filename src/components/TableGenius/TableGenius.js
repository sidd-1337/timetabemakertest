import React, { useState, useEffect, startTransition } from 'react';
import './TableGeniusNew.css';
import { useTranslation } from 'react-i18next';
import Header from '../Header';
import { useNavigate } from 'react-router-dom';
import '../TimetableMaker/AlertModal.css';
import '../TimetableMaker/AlertModal';
import '../TimetableMaker/OKAlertModal';
import AlertModal from "../TimetableMaker/AlertModal";
import OKAlertModal from "../TimetableMaker/OKAlertModal";

function TableGenius() {
    const [showForm, setShowForm] = useState(false);
    const [step, setStep] = useState(1);
    const { t,i18n  } = useTranslation();
    const navigate = useNavigate();
    const [clickedButton, setClickedButton] = useState('');
    const [displayedProgramName, setDisplayedProgramName] = useState('');
    const [showFormValidationAlert, setShowFormValidationAlert] = useState(false);
    const [showImportSubjectsAlert, setShowImportSubjectsAlert] = useState(false);


    const handleShowFormClick = () => {
        handleShowForm();
        setClickedButton(prevState => prevState === 'showForm' ? '' : 'showForm');
    };

    const handleMakeYourOwnClick = () => {
        handleMakeYourOwn();
        setClickedButton(prevState => prevState === 'makeYourOwn' ? '' : 'makeYourOwn');
    };

    const handleShowForm = () => {
        startTransition(() => {
            setShowForm(!showForm);
        });
    };

    const handleNextStep = (event) => {
        event.preventDefault();
        if (!faculty || !typeOfStudy || !formOfStudy || faculty === 'empty' || typeOfStudy === 'empty' || formOfStudy === 'empty') {
            // If any of them is empty, display a warning message
            setShowFormValidationAlert(true);
            return; // Exit the function without proceeding to the next step
        }
        setShowFormValidationAlert(false);
        setStep(step + 1);
        fetchData();
    };

    const [alertInfo, setAlertInfo] = useState({
        isOpen: false,
        message: '',
        onKeepBoth: () => {},
        onOverwrite: () => {},
        onCancel: () => {}
    });

    const [OKalertInfo, setOKAlertInfo] = useState({
        isOpen: false,
        message: '',
        title: '',
        onCancel: () => {}
    });

    const handleImportSubjects = () => {

        if (!grade || !programme || !schoolYear || !semester || grade === 'empty' || programme === 'empty' || schoolYear === 'empty' || semester === 'empty'|| !programmesList.some(prog => prog.nazevCZ === programme)) {
            // If any of them is empty, display a warning message
            setShowImportSubjectsAlert(true);
            return; // Exit the function without proceeding to the next step
        }

        setStep(step + 1);
        setShowImportSubjectsAlert(false);
        if (step === 2) {
            navigate('/timetable-maker', {
                state:{
                    programme: programme,
                    faculty: faculty,
                    typeOfStudy:typeOfStudy,
                    formOfStudy:formOfStudy,
                    grade:grade,
                    semester:semester
                }
            })
        }
    };
    const handleMakeYourOwn = () => {
        navigate('/timetable-maker', {
            state:{
                programme: "null",
                faculty: "null",
                typeOfStudy:"null",
                formOfStudy:"null",
                grade:"null",
                semester:"null"
            }
        })
    };

    // State for all filters and programme list
    const [faculty, setFaculty] = useState('');
    const [typeOfStudy, setTypeOfStudy] = useState('');
    const [formOfStudy, setFormOfStudy] = useState('');
    const [grade, setGrade] = useState('');
    const [schoolYear, setSchoolYear] = useState('');
    const [semester, setSemester] = useState('');
    const [programme, setProgramme] = useState('');
    const [programmesList, setProgrammesList] = useState([]);

    // Function to make API call with all filters
    const fetchData = async () => {
        try {
            const response = await fetch(`/api/data/getProgrammes?fakultaOboru=${faculty}&typ=${typeOfStudy}&forma=${formOfStudy}`);
            const data = await response.json();
            setProgrammesList(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            /*setOKAlertInfo({
                isOpen: true,
                message: t('ErrorFetchingData', error),
                title: t('Invalid action')
            });*/
            alert('Server off');
        }
    };
    /*
        useEffect(() => {
            // Call fetchData on component mount and whenever faculty, typeOfStudy, or formOfStudy changes
            fetchData();
        }, [faculty, typeOfStudy, formOfStudy]); // Dependencies array
    */

    const handleBackStep = () => {
        setStep(step - 1);
    };
    /*
        const handleGeneration = async () => {
            try {
                // Make the fetch call to get the subjects data
                const response = await fetch(`/api/data/getOborId?nazevCZ=${programme}&fakultaOboru=${faculty}&typ=${typeOfStudy}&forma=${formOfStudy}&grade=${grade}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const subjectsData = await response.json();

                // Convert the subjects data to a JSON string
                const subjectsJson = JSON.stringify(subjectsData);

                // Open a new window with the URL '/timetable-maker' and pass the subjects data as a query parameter
                const newWindow = window.open(`/timetable-maker?subjects=${encodeURIComponent(subjectsJson)}`, '_blank');
            } catch (error) {
                console.error('Error handling generation:', error);
            }
        };\r\n
     */

    // Function to handle form input changes
    const handleInputChange = (event) => {
        const { name, value, options, selectedIndex } = event.target;
        const selectedValue = options ? options[selectedIndex].value : value;
        console.log(`Setting ${name} to ${selectedValue}`); // Debug log

        switch(name) {
            case 'faculty':
                setFaculty(selectedValue);
                break;
            case 'typeOfStudy':
                setTypeOfStudy(selectedValue);
                break;
            case 'formOfStudy':
                setFormOfStudy(selectedValue);
                break;
            case 'grade':
                setGrade(selectedValue);
                break;
            case 'schoolYear':
                setSchoolYear(selectedValue);
                break;
            case 'programme':
                setProgramme(value);
                break;
            case 'semester':
                setSemester(value);
                break;
            default:
                break;
        }
        if (name === 'programme') {
            setDisplayedProgramName(value);
        }
    };

    const handleProgrammeSelection = (selectedProgram) => {
        setProgramme(selectedProgram.nazevCZ); // Store the Czech version internally
        // Update the displayed program name based on the current language
        const displayName = i18n.language.startsWith('cz') ? selectedProgram.nazevCZ : selectedProgram.nazevEN;
        setDisplayedProgramName(displayName);
    };

    /*
    const handleSubmit = (event) => {
        event.preventDefault();
        fetchData();
     };\r\n
     */

    const filteredProgrammes =  programme.length >= 2 && !programmesList.some(prog => prog.nazevCZ === programme)
        ? programmesList.filter(prog =>
            (prog.nazevCZ && prog.nazevCZ.toLowerCase().includes(programme.toLowerCase())) ||
            (prog.nazevEN && prog.nazevEN.toLowerCase().includes(programme.toLowerCase())))
        : [];

    const renderLeftSection = () => (
        <form>
            <div className="form-group">
                <label htmlFor="faculty">{t('faculty')}</label>
                <select id="faculty" name="faculty" value={faculty} onChange={handleInputChange}>
                    <option value="empty"></option>
                    <option value="FAU">FAU</option>
                    <option value="FFI">FFI</option>
                    <option value="FPD">FPD</option>
                    <option value="FPR">FPR</option>
                    <option value="FSS">FSS</option>
                    <option value="FZS">FZS</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="typeOfStudy">{t('typeOfStudy')}</label>
                <select id="typeOfStudy" name="typeOfStudy" value={typeOfStudy} onChange={handleInputChange}>
                    <option value="empty"></option>
                    <option value="Bakalářský">{t('Bachelor')}</option>
                    <option value="Navazující magisterský">{t('Postgraduate master')}</option>
                    <option value="Magisterský">{t('Undergraduate master')}</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="formOfStudy">{t('formOfStudy')}</label>
                <select id="formOfStudy" name="formOfStudy" value={formOfStudy} onChange={handleInputChange}>
                    <option value="empty"></option>
                    <option value="Prezenční">{t('Full-time')}</option>
                    <option value="Kombinovaná">{t('Part-time')}</option>
                    <option value="Distanční">{t('Distant')}</option>
                </select>
            </div>

            <div className="front-page-buttons">
                <button type="submit" className="front-btn-primary-next"
                        onClick={handleNextStep}>{t('next')}</button>
            </div>
            {showFormValidationAlert && (
                <div className="alert-simple">
                    <div className="icon-simple"></div>
                    {t('You must fill in all the boxes')}
                </div>
            )}
        </form>
    );

    const renderRightSection = () => (
        <form onSubmit={handleImportSubjects}>
            <div className="form-group">
                <label htmlFor="grade">{t('grade')}</label>
                <select id="grade" name="grade" value={grade} onChange={handleInputChange}>
                    <option value="empty">/</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="semester">{t('Semester')}</label>
                <select id="semester" name="semester" value={semester} onChange={handleInputChange}>
                    <option value="empty"></option>
                    <option value="LS">{t('Summer')}</option>
                    <option value="ZS">{t('Winter')}</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="schoolYear">{t('schoolYear')}</label>
                <select id="schoolYear" name="schoolYear" value={schoolYear} onChange={handleInputChange}>
                    <option value="empty"></option>
                    <option value="2023-2024">2023/2024</option>
                </select>
            </div>
            <div className="form-group programme-group">
                <label htmlFor="programme">{t('programme')}</label>
                <input
                    type="text"
                    id="programme"
                    name="programme"
                    value={displayedProgramName}
                    onChange={handleInputChange}
                    autoComplete="off"
                />
                {filteredProgrammes.length > 0 && (
                    <ul className="programme-suggestions">
                        {filteredProgrammes.map((prog, index) => {
                            // Determine the display name based on the current language
                            const displayName = i18n.language.startsWith('cz') ? prog.nazevCZ : prog.nazevEN;
                            return (
                                <li key={index} onClick={() => handleProgrammeSelection(prog)}>{displayName}</li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <button type="button" className="front-btn-primary-back" onClick={handleBackStep}>{t('Back')}</button>
            <button type="button" className="front-btn-primary-next" onClick={handleImportSubjects}>{t('Import subjects')}</button>
            {showForm && (!programmesList.some(prog => prog.nazevCZ === programme) && programme.length>0) && (
                <div className="alert-simple">
                    <div className="icon-simple"></div>
                    {t('Selected program is not on the list of available programs')}
                </div>
            )}
            {showImportSubjectsAlert  && (
                <div className="alert-simple">
                    <div className="icon-simple"></div>
                    {t('You must fill in all the boxes')}
                </div>
            )}
        </form>
    );

    return (
        <div className="container">
            <Header />
            <main>
                <div className="content-left">
                    <h1>{t('welcome')}</h1>
                    <p>{t('description')}</p>
                    <div className="front-page-buttons-align">
                        <button className="front-btn-black">{t('getstarted')}</button>
                        <button
                            className={`front-btn ${clickedButton === 'showForm' ? 'clicked' : ''}`}
                            onClick={handleShowFormClick}
                        >{t('stagload')}</button>
                        <button
                            className={`front-btn ${clickedButton === 'makeYourOwn' ? 'clicked' : ''}`}
                            onClick={handleMakeYourOwnClick}
                        >{t('ownmaking')}</button>
                    </div>
                </div>
                <div className="content-right">
                    {showForm ? (
                        step === 1 ? renderLeftSection() : renderRightSection()
                    ) : null}
                    {step === 2//&& (
                        // <button type="button" onClick={handleNextStep} className="toggle-button">
                        //   {showForm ? '▶' : '◀'}
                        //</button>
                        //)
                    }
                </div>
                <AlertModal
                    isOpen={alertInfo.isOpen}
                    message={alertInfo.message}
                    onKeepBoth={alertInfo.onKeepBoth}
                    onOverwrite={alertInfo.onOverwrite}
                    onCancel={() => setAlertInfo({ ...alertInfo, isOpen: false })}
                />
                <OKAlertModal
                    isOpen={OKalertInfo.isOpen}
                    message={OKalertInfo.message}
                    title={OKalertInfo.title}
                    onCancel={() => setOKAlertInfo({ ...OKalertInfo, isOpen: false })}
                />
            </main>
            <footer>
                © 2023 Nela Bulavová, Matyáš Grendysa, Siddharth Shukla
            </footer>
        </div>
    );
}

export default TableGenius;

