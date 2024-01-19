import React, { useState, useEffect, startTransition } from 'react';
import './TableGenius.css';
import { useTranslation } from 'react-i18next';
import Header from '../Header';

function TableGenius() {
  const [showForm, setShowForm] = useState(false);
  const { t } = useTranslation();

  const handleShowForm = () => {
    startTransition(() => {
      setShowForm(!showForm);
    });
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

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchData();
  };

  const filteredProgrammes = programme.length >= 2 
  ? programmesList.filter(prog => prog.toLowerCase().includes(programme.toLowerCase())) 
  : [];


  return (
    <div className="container">
    <Header/>
      <main>
        <div className="content-left">
        <h1>{t('welcome')}</h1>
          <p>{t('description')}</p>
          <div className="buttons">
            <button className="btn-primary">{t('getstarted')}</button>
            <button onClick={handleShowForm}>{t('stagload')}</button>
            <button>{t('ownmaking')}</button>
          </div>
        </div>
        <div className="content-right">
    {showForm && (
       <form onSubmit={handleSubmit}> 
            <div className="form-group">
                <label htmlFor="faculty">{t('faculty')}</label>
                <select id="faculty" name="faculty" onChange={handleInputChange}>
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
                <select id="typeOfStudy" name="typeOfStudy" onChange={handleInputChange}>
                    <option value="Bakalařský">Bakalářský</option>
                    <option value="Navazující magisterský">Navazující magisterský</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="formOfStudy">{t('formOfStudy')}</label>
                <select id="formOfStudy" name="formOfStudy" onChange={handleInputChange}>
                    <option value="Prezenční">Prezenční</option>
                    <option value="Kombinované">Kombinované</option>
                </select>
            </div>
            <button type="submit">{('loadProgrammes')}</button>
            <div className="form-group">
                <label htmlFor="grade">{t('grade')}</label>
                <select id="grade" name="grade">
                    <option value="grade1">1</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="schoolYear">{t('schoolYear')}</label>
                <select id="schoolYear" name="schoolYear">
                    <option value="2023-2024">2023 - 2023/2024</option>
                </select>
            </div>
            <div className="form-group programme-group">
              <label htmlFor="programme">{t('programme')}:</label>
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
                  <li key={index} onClick={() => setProgramme(prog)}>{prog}</li>
                ))}
              </ul>
          
            )}
            </div>
        </form>
    )}
</div>
      </main>
      <footer>
        © 2023 Nela Bulavová, Matyáš Grendysa, Siddharth Shukla
      </footer>
    </div>
  );
}

export default TableGenius;
