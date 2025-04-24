import React from 'react';
import './DriversSection.css';
import { getAvatarUrl } from '/Універ/Курсова БД/frontend/src/Util/getAvatarUrl';


const DriversSection = ({
  drivers,
  searchTerm,
  setSearchTerm,
  showAddForm,
  setShowAddForm,
  newDriver,
  setNewDriver,
  handleAddDriver
}) => {
  return (
    <div className="drivers-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Водії</h2>
        <div className="driver-controls">
          <input
            type="text"
            placeholder="Пошук..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={() => setShowAddForm(!showAddForm)} className="add-button">+ Додати водія</button>
        </div>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Новий водій</h3>
            <form className="add-driver-form" onSubmit={handleAddDriver}>
              <input
                type="text"
                placeholder="Ім’я"
                value={newDriver.name}
                onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Прізвище"
                value={newDriver.surname}
                onChange={(e) => setNewDriver({ ...newDriver, surname: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newDriver.email}
                onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Телефон"
                value={newDriver.phoneNumber}
                onChange={(e) => setNewDriver({ ...newDriver, phoneNumber: e.target.value })}
                required
              />
              <div className="button-row">
                <button type="submit">Зберегти</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="cancel-button">Скасувати</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="driver-cards">
        {drivers
          .filter(d => `${d.Surname} ${d.Name}`.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((d, index) => (
            <div className="driver-card" key={index}>
              <img
                src={getAvatarUrl(d.Email)}
                alt="avatar"
                className="driver-avatar"
              />
              <h3>{d.Surname} {d.Name}</h3>
              <p>📧 {d.Email}</p>
              <p>📞 {d.PhoneNumber}</p>
            </div>
          ))}
        {drivers.length === 0 && <p>Водії не знайдені.</p>}
      </div>
    </div>
  );
};

export default DriversSection;