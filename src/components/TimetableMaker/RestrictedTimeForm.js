import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { days, dayKeys } from './TimetableMaker';

function RestrictedTimeForm({ times, onAddSubject }) {
    const [day, setDay] = useState('');
    const [timeFrom, setTimeFrom] = useState('');
    const [timeTo, setTimeTo] = useState('');
    const [name, setName] = useState('');
    const { t, i18n } = useTranslation();
    const [errorMessage, setErrorMessage] = useState(''); // State for error message

    const handleSubmit = (e) => {
        e.preventDefault();
        // Convert times to Date objects for comparison
        const startTime = new Date(`01/01/2000 ${timeFrom}`);
        const endTime = new Date(`01/01/2000 ${timeTo}`);

        // Check if timeFrom is greater than timeTo
        if (startTime >= endTime) {
            setErrorMessage(true);
            return; // Prevent submission
        }

        const originalDay = days[dayKeys.indexOf(day)];
        onAddSubject({ originalDay, day, timeFrom, timeTo, name });
        // Reset form and clear error message
        setDay('');
        setTimeFrom('');
        setTimeTo('');
        setName('');
        setErrorMessage(''); // Clear error message after successful submission
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>{t('Day')}</label>
                <select value={day} onChange={(e) => setDay(e.target.value)} required>
                    <option value="">{t('ChooseDay')}</option>
                    {dayKeys.map((dayKey) => (
                        <option key={dayKey} value={dayKey}>{t(dayKey)}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>{t('TimeFrom')}</label>
                <select value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} required>
                    {times.map(({from}) => (
                        <option key={from} value={from}>{from}</option>
                    ))}
                </select>
                <label className="label-to">{t('To')}</label>
                <select value={timeTo} onChange={(e) => setTimeTo(e.target.value)} required>
                    {times.map(({to}) => (
                        <option key={to} value={to}>{to}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>{t('Name')}</label>
                <input id="namerestricted" type="text" value={name} onChange={(e) => setName(e.target.value)} required/>
            </div>
            <div className="buttons buttons-left">
                <button type="submit" className="btn-primary">{t('AddRestrictedTime')}</button>
            </div>
            {errorMessage && <div className="alert-simple">
                <div className="icon-simple"></div>
                {t('TimeToTimeFrom')}
            </div>}
        </form>
    );
}

export default RestrictedTimeForm;
