import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Directly define the API call function within the same file
async function loadSubject(zkratka, katedra) {
    try {
        const response = await fetch(`/api/data/getSubject?zkratka=${zkratka}&katedra=${katedra}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching subject data:', error);
        throw error; // Allows the caller to handle the error
    }
}

function SubjectLoaderForm({ onSubjectAdded }) {
    const [subjectAbbreviation, setSubjectAbbreviation] = useState('');
    const [department, setDepartment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(''); // State for error message
    const [errorMessageServerOff, setErrorMessageServerOff] = useState(''); // State for error message
    const { t, i18n } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(''); // Clear previous error message
        setErrorMessageServerOff(''); // Clear previous error message

        try {
            const subjectData = await loadSubject(subjectAbbreviation, department);
            // Process the subject data here as needed before adding it
            onSubjectAdded(subjectData); // Assuming onSubjectAdded is a prop function to handle the addition
            setIsLoading(false);
            if (Object.keys(subjectData).length === 0) {
                // Handle the empty object case here
                setErrorMessage(t('NoDataReturned'));
                setIsLoading(false);
            }
        } catch (error) {
            setErrorMessageServerOff(t('ServerOffline'));
            setIsLoading(false);
        }
    };

    const handleAbbreviationChange = (e) => {
        setSubjectAbbreviation(e.target.value.toUpperCase());
    };

    const handleDepartmentChange = (e) => {
        setDepartment(e.target.value.toUpperCase());
    };

    return (
        <form onSubmit={handleSubmit} className="your-form-class">
            <div className="form-group">
                <label htmlFor="subjectAbbreviation">{t('SubjectAbbreviation')}</label>
                <input
                    id="subjectAbbreviation"
                    type="text"
                    value={subjectAbbreviation}
                    onChange={handleAbbreviationChange}
                    className="your-input-class"
                    required
                />
            </div>
            <div className="form-group">
                <label htmlFor="department">{t('Department')}</label>
                <input
                    id="department"
                    type="text"
                    value={department}
                    onChange={handleDepartmentChange}
                    className="your-input-class"
                    required
                />
            </div>
            <div className="buttons buttons-left">
                <button type="submit" className="btn-primary">{t('LoadSubject')}</button>
            </div>
            {errorMessage && <div className="alert-simple">
                <div className="icon-simple"></div>
                {(t('NoDataReturned'))}
            </div>}
            {errorMessageServerOff && <div className="alert-simple">
                <div className="icon-simple"></div>
                {(t('ServerOffline'))}
            </div>}
        </form>
    );
}

export default SubjectLoaderForm;
