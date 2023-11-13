import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import TableGenius from './components/TableGenius/TableGenius';
import TimetableMaker from './components/TimetableMaker/TimetableMaker';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TableGenius />} />
        <Route path="/timetable-maker" element={<TimetableMaker />} />
        {/* other routes */}
      </Routes>
    </Router>
  );
}

export default App;