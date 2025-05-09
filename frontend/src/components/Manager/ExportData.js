import React, { useState } from 'react';
import './ExportData.css';
import axios from 'axios';

const ExportData = () => {
  const availableTables = ['Замовлення', 'Оплати', 'Автопарк', 'Водії'];
  const exportFormats = ['PDF', 'CSV', 'JSON', 'Excel'];

  const [selectedTables, setSelectedTables] = useState([]);
  const [selectedFormats, setSelectedFormats] = useState([]);

  const handleTableChange = (table) => {
    setSelectedTables(prev =>
      prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]
    );
    setSelectedFormats([]); // скидуємо формати при зміні таблиць
  };

  const handleFormatChange = (format) => {
    setSelectedFormats(prev =>
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const handleExport = () => {
    if (selectedTables.length === 0 || selectedFormats.length === 0) {
      alert('Оберіть хоча б одну таблицю та один формат!');
      return;
    }
  
    selectedTables.forEach((table) => {
      selectedFormats.forEach((format) => {
        axios.post('http://localhost:5000/export', {
          table,
          format
        }, {
          responseType: 'blob'
        })
        .then(res => {
          const blob = new Blob([res.data]);
          const a = document.createElement('a');
          a.href = window.URL.createObjectURL(blob);
          a.download = `${table}.${format.toLowerCase()}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        })
        .catch(err => {
          console.error(`❌ Помилка експорту (${table} - ${format}):`, err);
        });
      });
    });
  };
  

  return (
    <div className="export-container">
      <h2>Експорт даних</h2>
      <div className="section">
        <h4>Оберіть таблиці:</h4>
        <div className="checkbox-grid">
          {availableTables.map((table) => (
            <label key={table}>
              <input
                type="checkbox"
                checked={selectedTables.includes(table)}
                onChange={() => handleTableChange(table)}
              />
              {table}
            </label>
          ))}
        </div>
      </div>

      <div className="section">
        <h4>Оберіть формат експорту:</h4>
        <div className="checkbox-grid">
          {exportFormats.map((format) => (
            <label key={format}>
              <input
                type="checkbox"
                checked={selectedFormats.includes(format)}
                onChange={() => handleFormatChange(format)}
                disabled={selectedTables.length === 0}
              />
              {format}
            </label>
          ))}
        </div>
      </div>

      <div className="export-action">
        <button
          className="export-button"
          onClick={handleExport}
          disabled={selectedTables.length === 0 || selectedFormats.length === 0}
        >
          Експортувати
        </button>
      </div>
    </div>
  );
};

export default ExportData;
