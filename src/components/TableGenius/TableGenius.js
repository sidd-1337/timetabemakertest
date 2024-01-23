import React, { useState, useEffect, startTransition } from 'react';
import './TableGenius.css';
import { useTranslation } from 'react-i18next';
import Header from '../Header';

function TableGenius() {
    const [showForm, setShowForm] = useState(false);
    const [step, setStep] = useState(1);
    const { t } = useTranslation();

    const handleShowForm = () => {
        startTransition(() => {
            setShowForm(!showForm);
        });
    };

    const handleNextStep = () => {
        if (!faculty || !typeOfStudy || !formOfStudy || faculty === 'empty' || typeOfStudy === 'empty' || formOfStudy === 'empty') {
            // If any of them is empty, display a warning message
            return; // Exit the function without proceeding to the next step
        }
        setStep(step + 1);
        fetchData();
    };

    // State for all filters and programme list
    const [faculty, setFaculty] = useState('');
    const [typeOfStudy, setTypeOfStudy] = useState('');
    const [formOfStudy, setFormOfStudy] = useState('');
    const [grade, setGrade] = useState('');
    const [schoolYear, setSchoolYear] = useState('');
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
        }
    };

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
    };

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
            default:
                break;
        }
        if (event.target.name === 'programme') {
            setProgramme(event.target.value);
        }
    };

    const handleProgrammeSelection = (selectedProgramme) => {
        setProgramme(selectedProgramme);
        //setProgrammesList([]); // Clear the suggestions list after selection
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        fetchData();
    };

    const filteredProgrammes = programme.length >= 2 && !programmesList.includes(programme)
        ? programmesList.filter(prog => prog.toLowerCase().includes(programme.toLowerCase()))
        : [];


    const renderLeftSection = () => (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="faculty">{t('faculty')}</label>
                <select id="faculty" name="faculty" value={faculty} onChange={handleInputChange}>
                    <option value="empty">/</option>
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
                    <option value="empty">/</option>
                    <option value="Bakalařský">Bakalářský</option>
                    <option value="Navazující magisterský">Navazující magisterský</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="formOfStudy">{t('formOfStudy')}</label>
                <select id="formOfStudy" name="formOfStudy" value={formOfStudy} onChange={handleInputChange}>
                    <option value="empty">/</option>
                    <option value="Prezenční">Prezenční</option>
                    <option value="Kombinované">Kombinované</option>
                </select>
            </div>
            {showForm && (!faculty || !typeOfStudy || !formOfStudy || faculty === 'empty' || typeOfStudy === 'empty' || formOfStudy === 'empty') && (
                <div className="error-message">{t('You must fill in all the boxes')}</div>
            )}

            <button type="submit" className="btn-primary-next" onClick={handleNextStep}>{t('next')}</button>
        </form>
    );

    const renderRightSection = () => (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="grade">{t('grade')}</label>
                <select id="grade" name="grade" value={grade} onChange={handleInputChange}>
                    <option value="empty">/</option>
                    <option value="grade1">1</option>
                    <option value="grade2">2</option>
                    <option value="grade3">3</option>
                    <option value="grade4">4</option>
                    <option value="grade5">5</option>
                </select>
            </div>
                <div className="form-group">
                    <label htmlFor="schoolYear">{t('schoolYear')}</label>
                    <select id="schoolYear" name="schoolYear" value={schoolYear} onChange={handleInputChange}>
                        <option value="empty">/</option>
                        <option value="2023-2024">2023 - 2023/2024</option>
                    </select>
                </div>
                <div className="form-group programme-group">
                    <label htmlFor="programme">{t('programme')}</label>
                    <input
                        type="text"
                        id="programme"
                        name="programme"
                        value={programme}
                        onChange={handleInputChange}
                        autoComplete="off"
                    />
                    {filteredProgrammes.length > 0 && (
                        <ul className="programme-suggestions">
                            {filteredProgrammes.map((prog, index) => (
                                <li key={index} onClick={() => handleProgrammeSelection(prog)}>{prog}</li>
                            ))}
                        </ul>
                    )}
                </div>
            {showForm && (!grade || !programme || !schoolYear || grade === 'empty' || programme === 'empty' || schoolYear === 'empty') && (
                <div className="error-message">
                    {t('You must fill in all the boxes')}
                </div>
            )}
            {showForm && (!programmesList.includes(programme) && programme.length>0) && (
                <div className="error-message">
                    {t('Selected program is not on the list of available programs')}
                </div>
            )}
            <button type="button" className="btn-primary-back" onClick={handleBackStep}>{t('Back')}</button>
            <button type="submit" className="btn-primary-next" onClick={handleNextStep}>{t('Import subjects')}</button>
        </form>
    );

    return (
        <div className="container">
            <Header />
            <main>
                <div className="content-left">
                    <h1>{t('welcome')}</h1>
                    <p>{t('description')}</p>
                    <div className="buttons">
                        <span className="btn-primary">{t('getstarted')}</span>
                        <button onClick={handleShowForm}>{t('stagload')}</button>
                        <button>{t('ownmaking')}</button>
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
            </main>
            <footer>
                © 2023 Nela Bulavová, Matyáš Grendysa, Siddharth Shukla
            </footer>
        </div>
    );
}

export default TableGenius;
