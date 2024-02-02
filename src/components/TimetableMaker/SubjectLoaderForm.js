import React, { useState } from 'react';

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
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const subjectData = await loadSubject(subjectAbbreviation, department);
            // Process the subject data here as needed before adding it
            onSubjectAdded(subjectData); // Assuming onSubjectAdded is a prop function to handle the addition
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load subject:', error);
            setError('Failed to load subject');
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="your-form-class">
            <div className="form-group">
                <label htmlFor="subjectAbbreviation">Subject Abbreviation:</label>
                <input
                    id="subjectAbbreviation"
                    type="text"
                    value={subjectAbbreviation}
                    onChange={(e) => setSubjectAbbreviation(e.target.value)}
                    className="your-input-class"
                    required
                />
            </div>
            <div className="form-group">
                <label htmlFor="department">Department:</label>
                <input
                    id="department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="your-input-class"
                    required
                />
            </div>
            <div className="buttons buttons-left">
                <button type="submit" className="btn-primary">Load Subject</button>
            </div>
        </form>
    );
}

export default SubjectLoaderForm;
