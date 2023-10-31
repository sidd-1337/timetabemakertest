import React, { useState, startTransition } from 'react';
import './TableGenius.css';
import { useTranslation } from 'react-i18next';

function TableGenius() {
  const [showForm, setShowForm] = useState(false);
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const changeLanguage = (lng) => {
  startTransition(() => {
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng);
  });
};
  const handleShowForm = () => {
    startTransition(() => {
      setShowForm(!showForm);
    });
  };
  
  return (
    <div className="container">
    <header>
        <div className="logo">TableGenius<span role="img" aria-label="lightbulb">💡</span></div>
        <div className="language-buttons">
          {currentLanguage === 'en' && <button onClick={() => changeLanguage('cz')}>Čeština</button>}
          {currentLanguage === 'cz' && <button onClick={() => changeLanguage('en')}>English</button>}
        </div>
      </header>
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
        <form>
            <div className="form-group">
                <label htmlFor="faculty">{t('faculty')}</label>
                <select id="faculty" name="faculty">
                    <option value="FAU">FAU</option>
                    <option value="FFI">FFI</option>
                    <option value="FPD">FPD</option>
                    <option value="FPR">FPR</option>
                    <option value="FSS">FSS</option>
                    <option value="FZS">FZS</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="schoolYear">{t('schoolYear')}</label>
                <select id="schoolYear" name="schoolYear">
                    <option value="2023-2024">2023 - 2023/2024</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="programme">{t('programme')}:</label>
                <input type="text" id="programme" name="programme" />
            </div>
            <div className="form-group">
                <label htmlFor="yearOfStudies">{t('yearOfStudies')}:</label>
                <input type="text" id="yearOfStudies" name="yearOfStudies" />
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
