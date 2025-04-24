import React, { useState } from 'react';
import './VehiclesSection.css';

const VehiclesSection = ({ vehicles }) => {
  const [expandedVehicleIds, setExpandedVehicleIds] = useState([]);

  const toggleVehicleDetails = (vehicleId) => {
    setExpandedVehicleIds(prev =>
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  return (
    <div className="vehicles-section">
      <h2>Автопарк</h2>
      <div className="vehicle-cards-container">
        {vehicles.map((v) => {
          const isSelected = expandedVehicleIds.includes(v.VehiclesId);

          return (
            <div
              key={v.VehiclesId}
              className={`vehicle-card ${isSelected ? 'expanded' : ''}`}
            >
              <h3>{v.LicensePlate}</h3>
              <p><strong>{v.BrandName}</strong> {v.Model} ({v.ReleaseYear})</p>
              <p>{v.VehicleStatus}</p>

              {isSelected && (
                <div className="vehicle-details">
                  <hr />
                  <p><strong>🔧 VIN:</strong> {v.VinNumber}</p>
                  <p><strong>📍 Пробіг:</strong> {v.Mileage} км</p>
                  <p><strong>📅 Рік:</strong> {v.ReleaseYear}</p>
                  <p><strong>🚚 Тип:</strong> {v.VehicleTypeName}</p>
                  <p><strong>📊 Статус:</strong> {v.VehicleStatus}</p>
                  <p><strong>🎨 Колір:</strong> {v.ColorName}</p>
                  <p><strong>📦 Обʼєм:</strong> {v.Volume}м³</p>
                  <p><strong>⚖️ Вантажопідйомність:</strong> {v.PayloadCapacity} кг</p>
                  <p><strong>⛽ Витрата пального:</strong> {v.FuelExpense} л/100км</p>
                  <p><strong>🛢️ Тип пального:</strong> {v.FuelTypeName}</p>
                  <p><strong>⚙️ Коробка передач:</strong> {v.GearboxTypeName}</p>
                </div>
              )}

              <button
                type="button"
                className="toggle-button"
                onClick={() => toggleVehicleDetails(v.VehiclesId)}
              >
                {isSelected ? 'Згорнути' : 'Детальніше'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VehiclesSection;
