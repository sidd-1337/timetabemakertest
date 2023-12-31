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
      <div className="logo">TableGenius<span role="img" aria-label="lightbulb">💡</span></div>
      <div className="language-buttons">
        {currentLanguage === 'en' && <button onClick={() => changeLanguage('cz')}>Čeština</button>}
        {currentLanguage === 'cz' && <button onClick={() => changeLanguage('en')}>English</button>}
      </div>
    </header>
  );
}
export default Header;