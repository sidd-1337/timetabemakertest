import React, { useState } from 'react';

function RestrictedTimeForm({ days, times, onAddSubject }) {
    const [day, setDay] = useState('');
    const [timeFrom, setTimeFrom] = useState('');
    const [timeTo, setTimeTo] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Použití timeFrom a timeTo pro vytvoření jednoho časového řetězce

        onAddSubject({ day, timeFrom, timeTo, name });
        // Reset formuláře
        setDay('');
        setTimeFrom('');
        setTimeTo('');
        setName('');
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Den */}
            <div className="form-group">
                <label>Day</label>
                <select value={day} onChange={(e) => setDay(e.target.value)} required>
                    <option value="">Choose day</option>
                    {days.map((dayOption) => (
                        <option key={dayOption} value={dayOption}>{dayOption}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Time from</label>
                <select value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} required>
                    {times.map(({from}) => (
                        <option key={from} value={from}>{from}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Time to</label>
                <select value={timeTo} onChange={(e) => setTimeTo(e.target.value)} required>
                    {times.map(({to}) => (
                        <option key={to} value={to}>{to}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required/>
            </div>
            <div className="buttons buttons-left">
                <button type="submit" className="btn-primary">Add restricted time</button>
            </div>
        </form>
);
}

export default RestrictedTimeForm;
