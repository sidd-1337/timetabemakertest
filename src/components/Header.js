import React, { useState, startTransition } from 'react';
import './TableGenius/TableGenius.css';
import { useTranslation } from 'react-i18next';

function Header() {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const changeLanguage = (lng) => {
    startTransition(() => {
      i18n.changeLanguage(lng);
      setCurrentLanguage(lng);
    });
  };

  return (
    <header>
    <div className="logo">TimetableGenius<img src="/images/timetable_maker_logo.png" alt="TimetableGenius Logo" className="logo-img" /></div>
      <div className="switch">
        <input id="language-toggle" className="check-toggle check-toggle-round-flat" type="checkbox"
               checked={currentLanguage === 'cz'}
               onChange={() => changeLanguage(currentLanguage === 'en' ? 'cz' : 'en')}/>
        <label htmlFor="language-toggle"></label>
        <span className="on">EN</span>
        <span className="off">CZ</span>
      </div>
    </header>
  );
}

export default Header;