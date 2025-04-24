import React, { useState, useEffect,useRef} from 'react';
import axios from 'axios';
import './ManagerDashboard.css';
import { useNavigate } from 'react-router-dom';
import ExportData from './ExportData';
import LocationAutocomplete from './LocationAutocomplete';

const formatDate = (isoString) => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(' ', ' ');
};

const validateDriver = ({ name, surname, email, phoneNumber }) => {
  const nameRegex = /^[a-zA-Zа-яА-ЯёЁіІїЇєЄ]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10,15}$/;

  if (!nameRegex.test(name)) {
    alert('Ім’я має містити лише літери');
    return false;
  }
  if (!nameRegex.test(surname)) {
    alert('Прізвище має містити лише літери');
    return false;
  }
  if (!emailRegex.test(email)) {
    alert('Невірний формат email');
    return false;
  }
  if (!phoneRegex.test(phoneNumber)) {
    alert('Телефон має містити від 10 до 15 цифр');
    return false;
  }
  return true;
};

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const recordsPerPage = 50;
    const [totalOrdersCount, setTotalOrdersCount] = useState(0);
    const [newOrder, setNewOrder] = useState({
      orderNumber: '',
      orderDate: '',
      deliveryTime: '',
      price: '',
      distance: '',
      clientId: '',
      employeeId: '',
      uploadLocationId: '',
      downloadLocationId: '',
      statusId: 1
    });
    const [showNewOrderForm, setShowNewOrderForm] = useState(false);
    const [clients, setClients] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [locations, setLocations] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [activeSection, setActiveSection] = useState('orders');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newDriver, setNewDriver] = useState({ name: '', surname: '', email: '', phoneNumber: '' });
    const [payments, setPayments] = useState([]);
    const [paymentPage, setPaymentPage] = useState(1);
    const [totalPaymentPages, setTotalPaymentPages] = useState(1);
    const [searchEmployee, setSearchEmployee] = useState('');
    const [showEmployeeList, setShowEmployeeList] = useState(false);
    const [searchClient, setSearchClient] = useState('');
    const [showClientList, setShowClientList] = useState(false);
    

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
  };

  useEffect(() => {
    axios.get('http://localhost:5000/orders/count')
      .then(res => setTotalOrdersCount(res.data.total))
      .catch(err => console.error('Помилка отримання кількості замовлень:', err));
    axios.get('http://localhost:5000/clients').then(res => setClients(res.data));
    axios.get('http://localhost:5000/employees').then(res => setEmployees(res.data));

    //axios.get('http://localhost:5000/locations').then(res => setLocations(res.data));
    axios.get('http://localhost:5000/orders/last-number')
    .then(res => {
      const nextNumber = parseInt(res.data.lastNumber || 0) + 1;
      setNewOrder(order => ({ ...order, orderNumber: nextNumber }));
    })
    .catch(err => console.error('Помилка отримання останнього номера замовлення:', err));
    
    if (activeSection === 'orders') {
        axios.get(`http://localhost:5000/orders?page=${currentPage}&limit=${recordsPerPage}`)
        .then(res => {
            setOrders(res.data.orders);
            setTotalPages(Math.ceil(res.data.totalCount / recordsPerPage));
        })
    .catch(err => console.error('Помилка отримання замовлень:', err));

    } else if (activeSection === 'drivers') {
      axios.get('http://localhost:5000/drivers')
        .then(res => setDrivers(res.data))
        .catch(err => console.error('Помилка отримання водіїв:', err));
    } else if (activeSection === 'vehicles') {
      axios.get('http://localhost:5000/vehicles')
        .then(res => setVehicles(res.data))
        .catch(err => console.error('Помилка отримання автопарку:', err));
    } else if (activeSection === 'payments') {
        axios.get(`http://localhost:5000/payments?page=${paymentPage}&limit=${recordsPerPage}`)
          .then(res => {
            setPayments(res.data.payments); // payments from Flask
            setTotalPaymentPages(Math.ceil(res.data.total / recordsPerPage)); // total from Flask
          })
          .catch(err => console.error('Помилка отримання оплат:', err));
      }
      
  }, [activeSection, currentPage, paymentPage]);;

  const uploadRef = useRef();
  const downloadRef = useRef();
  
  const handleCreateOrder = async () => {
    try {
      const uploadData = uploadRef.current.getLocationData();
      const downloadData = downloadRef.current.getLocationData();
  
      const uploadResponse = await axios.post('http://localhost:5000/locations/smart-add', uploadData);
      const downloadResponse = await axios.post('http://localhost:5000/locations/smart-add', downloadData);
  
      const uploadLocationId = uploadResponse.data.locationId;
      const downloadLocationId = downloadResponse.data.locationId;
  
      const finalOrder = {
        ...newOrder,
        uploadLocationId,
        downloadLocationId
      };
  
      await axios.post('http://localhost:5000/orders', finalOrder);
      setShowNewOrderForm(false);
      setNewOrder({});
      const refreshed = await axios.get(`http://localhost:5000/orders?page=${currentPage}&limit=50`);
      setOrders(refreshed.data.orders);
    } catch (err) {
      console.error('Помилка створення замовлення:', err);
      alert('Помилка створення замовлення');
    }
  };
  


  const handleAddDriver = (e) => {
    e.preventDefault();
    if (!validateDriver(newDriver)) return;

    axios.post('http://localhost:5000/drivers', newDriver)
      .then(() => {
        setNewDriver({ name: '', surname: '', email: '', phoneNumber: '' });
        setShowAddForm(false);
        return axios.get('http://localhost:5000/drivers');
      })
      .then(res => setDrivers(res.data))
      .catch(err => console.error('Помилка додавання водія:', err));
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo">TransWay</div>
        <ul className="menu">
          <li className={activeSection === 'orders' ? 'active' : ''} onClick={() => setActiveSection('orders')}>Замовлення</li>
          <li className={activeSection === 'drivers' ? 'active' : ''} onClick={() => setActiveSection('drivers')}>Водії</li>
          <li className={activeSection === 'vehicles' ? 'active' : ''} onClick={() => setActiveSection('vehicles')}>Автопарк</li>
          <li className={activeSection === 'payments' ? 'active' : ''} onClick={() => setActiveSection('payments')}>Оплати</li>
          <li
          className={activeSection === 'export' ? 'active' : ''}
          onClick={() => setActiveSection('export')}
        >
          Експорт даних
        </li>

        </ul>
        <button className="logout-button" onClick={handleLogout}>
          <img src="https://www.svgrepo.com/show/532551/logout-1.svg" alt="logout" className="logout-icon" />
          Logout
        </button>
      </aside>

      <main className="main-content">
      
        <h1>Привіт, Менеджере 👋</h1>
        {/* Замовлення */}
        {activeSection === 'export' && (
        <ExportData availableTables={['Orders', 'Drivers', 'Vehicles', 'Payments']} />
        )}

        {activeSection === 'orders' && (
          <>
            <div className="cards">
              <div className="card"><p>Кількість замовлень</p><strong>{totalOrdersCount}</strong></div>
              <div className="card"><p>Completed</p><strong>–</strong></div>
              <div className="card"><p>In Progress</p><strong>–</strong></div>
            </div>
            <div className="table-section">
              <div className="table-header">
                <h2>Усі замовлення</h2>
                <input type="text" placeholder="Пошук..." />
                <button onClick={() => setShowNewOrderForm(true)} className="add-button">+ Нове замовлення</button>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>№ замовлення</th><th>Клієнт</th><th>Відстань</th><th>Час доставки</th><th>Ціна</th>
                      <th>Дата замовлення</th><th>Локація завантаження</th><th>Локація розвантаження</th>
                      <th>Статус</th><th>Час виконання</th><th>Час завершення</th><th>Працівник</th><th>Авто</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, index) => (
                      <tr key={index}>
                        <td>{order.OrderNumber}</td><td>{order.ClientName}</td><td>{order.Distance} км</td>
                        <td>{order.DeliveryTime}</td><td>{order.Price}₴</td><td>{formatDate(order.OrderDate)}</td>
                        <td>{order.UploadLocation}</td><td>{order.DownloadLocation}</td><td>{order.StatusName}</td>
                        <td>{formatDate(order.StartTime)}</td><td>{formatDate(order.EndTime)}</td>
                        <td>{order.EmployeeName || '—'}</td><td>{order.LicensePlate || '—'}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && (<tr><td colSpan="13">Замовлення відсутні.</td></tr>)}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                {/* Перша сторінка */}
                <button
                    className={currentPage === 1 ? 'active' : ''}
                    onClick={() => setCurrentPage(1)}
                >
                    1
                </button>
                {currentPage > 4 && <span className="dots">...</span>}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                    page =>
                        page !== 1 &&
                        page !== totalPages &&
                        page >= currentPage - 2 &&
                        page <= currentPage + 2
                    )
                    .map(page => (
                    <button
                        key={page}
                        className={currentPage === page ? 'active' : ''}
                        onClick={() => setCurrentPage(page)}
                    >
                        {page}
                    </button>
                    ))}
                {currentPage < totalPages - 3 && <span className="dots">...</span>}
                {totalPages > 1 && (
                    <button
                    className={currentPage === totalPages ? 'active' : ''}
                    onClick={() => setCurrentPage(totalPages)}
                    >
                    {totalPages}
                    </button>
                )}
            </div>
        </div>
        </>
    )}
    {showNewOrderForm && (
              <div className="modal-overlay">
                <div className="modal-card">
                  <h3>Нове замовлення</h3>
                  <div className="form-grid">
                    <input type="text" placeholder="Номер замовлення" value={newOrder.orderNumber || ''} readOnly/>
                    <input type="text" placeholder="Час доставки" onChange={(e) => setNewOrder({ ...newOrder, deliveryTime: e.target.value })} />
                    <input type="number" placeholder="Ціна" onChange={(e) => setNewOrder({ ...newOrder, price: e.target.value })} />
                    <input type="number" placeholder="Відстань" onChange={(e) => setNewOrder({ ...newOrder, distance: e.target.value })} />
                    <div className="autocomplete">
                      <input
                        type="text"
                        placeholder="Введіть ім’я або прізвище клієнта"
                        value={searchClient}
                        onChange={(e) => {
                          setSearchClient(e.target.value);
                          setShowClientList(true);
                        }}
                        onBlur={() => setTimeout(() => setShowClientList(false), 200)}
                      />
                      {showClientList && (
                        <ul className="autocomplete-list">
                        {clients
                          .filter(c => {
                            const [surname, name] = c.FullName.toLowerCase().split(' ');
                            const query = searchClient.toLowerCase();
                            return surname.startsWith(query) || name.startsWith(query);
                          })
                          .map(c => (
                            <li
                              key={c.ClientId}
                              onClick={() => {
                                setNewOrder({ ...newOrder, clientId: c.ClientId });
                                setSearchClient(c.FullName);
                                setShowClientList(false);
                              }}
                            >
                              {c.FullName}
                            </li>
                          ))}
                      </ul>
                      
                      )}
                    </div>

                    <div className="autocomplete">
                      <input
                        type="text"
                        placeholder="Введіть ім’я або прізвище працівника"
                        value={searchEmployee}
                        onChange={(e) => {
                          setSearchEmployee(e.target.value);
                          setShowEmployeeList(true);
                        }}
                        onBlur={() => setTimeout(() => setShowEmployeeList(false), 200)} // щоб можна було клікнути
                      />
                      {showEmployeeList && (
                        <ul className="autocomplete-list">
                        {employees
                          .filter(e => {
                            const [surname, name] = e.FullName.toLowerCase().split(' ');
                            const query = searchEmployee.toLowerCase();
                            return surname.startsWith(query) || name.startsWith(query);
                          })
                          .map(e => (
                            <li
                              key={e.EmployeeId}
                              onClick={() => {
                                setNewOrder({ ...newOrder, employeeId: e.EmployeeId });
                                setSearchEmployee(e.FullName);
                                setShowEmployeeList(false);
                              }}
                            >
                              {e.FullName}
                            </li>
                          ))}
                      </ul>
                      
                      )}
                    </div>
                    <LocationAutocomplete label="Місце завантаження" ref={uploadRef} />
                    <LocationAutocomplete label="Місце розвантаження" ref={downloadRef} />
                  </div>
                  <div className="button-row">
                    <button onClick={handleCreateOrder}>Зберегти</button>
                    <button className="cancel-button" onClick={() => setShowNewOrderForm(false)}>Скасувати</button>
                  </div>
                </div>
              </div>
            )}
        {/* Водії */}
        {activeSection === 'drivers' && (
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
                    <input type="text" placeholder="Ім’я" value={newDriver.name} onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })} required />
                    <input type="text" placeholder="Прізвище" value={newDriver.surname} onChange={(e) => setNewDriver({ ...newDriver, surname: e.target.value })} required />
                    <input type="email" placeholder="Email" value={newDriver.email} onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })} required />
                    <input type="text" placeholder="Телефон" value={newDriver.phoneNumber} onChange={(e) => setNewDriver({ ...newDriver, phoneNumber: e.target.value })} required />
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
                    <img src={`https://i.pravatar.cc/150?img=${index + 10}`} alt="avatar" className="driver-avatar" />
                    <h3>{d.Surname} {d.Name}</h3>
                    <p>📧 {d.Email}</p>
                    <p>📞 {d.PhoneNumber}</p>
                  </div>
                ))}
              {drivers.length === 0 && <p>Водії не знайдені.</p>}
            </div>
          </div>
        )}

        {/* Автопарк */}
        {activeSection === 'vehicles' && (
          <div className="vehicles-section">
            <h2>Автопарк</h2>
            <div className="vehicle-cards">
              {vehicles.map((v, i) => (
                <div key={i} className="vehicle-card">
                  <h3>{v.LicensePlate}</h3>
                  <p><strong>{v.BrandName}</strong> {v.Model} ({v.ReleaseYear})</p>
                  <p>{v.VehicleStatus}</p>
                  <div style={{ textAlign: 'right' }}>
                    <button className="details-button" onClick={() => setSelectedVehicle(v)}>Детальніше</button>
                  </div>
                </div>
              ))}
              {vehicles.length === 0 && <p>Транспортні засоби відсутні.</p>}
            </div>

            {selectedVehicle && (
              <div className="modal-overlay">
                <div className="modal-card">
                  <h3>{selectedVehicle.LicensePlate} — {selectedVehicle.BrandName} {selectedVehicle.Model}</h3>
                  <p><strong>🔧 VIN:</strong> {selectedVehicle.VinNumber}</p>
                    <p><strong>📍 Пробіг:</strong> {selectedVehicle.Mileage} км</p>
                    <p><strong>📅 Рік:</strong> {selectedVehicle.ReleaseYear}</p>
                    <p><strong>🚚 Тип:</strong> {selectedVehicle.VehicleTypeName}</p>
                    <p><strong>📊 Статус:</strong> {selectedVehicle.VehicleStatus}</p>
                    <p><strong>🎨 Колір:</strong> {selectedVehicle.ColorName}</p>
                    <p><strong>📦 Обʼєм:</strong> {selectedVehicle.Volume}м³</p>
                    <p><strong>⚖️ Вантажопідйомність:</strong> {selectedVehicle.PayloadCapacity} кг</p>
                    <p><strong>⛽ Витрата пального:</strong> {selectedVehicle.FuelExpense} л/100км</p>
                    <p><strong>🛢️ Тип пального:</strong> {selectedVehicle.FuelTypeName}</p>
                    <p><strong>⚙️ Коробка передач:</strong> {selectedVehicle.GearboxTypeName}</p>

                  <div className="button-row">
                    <button className='cancel-button' type="button" onClick={() => setSelectedVehicle(null)}>Закрити</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeSection === 'payments' && (
            <div className="table-section">
                <div className="table-header">
                <h2>Усі оплати</h2>
                </div>
                <div className="table-scroll">
                <table>
                    <thead>
                    <tr>
                        <th>Номер замовлення</th>
                        <th>Дата оплати</th>
                        <th>Сума</th>
                        <th>Метод оплати</th>
                        <th>Клієнт</th>
                    </tr>
                    </thead>
                    <tbody>
                    {payments.map((p, i) => (
                        <tr key={i}>
                        <td>{p.OrderNumber}</td>
                        <td>{formatDate(p.PaymentDate)}</td>
                        <td>{p.Amount} ₴</td>
                        <td>{p.PaymentMethodName}</td>
                        <td>{p.ClientName}</td>
                        </tr>
                    ))}
                    {payments.length === 0 && (
                        <tr><td colSpan="5">Оплати відсутні.</td></tr>
                    )}
                    </tbody>
                </table>
                </div>

                {/* Пагінація */}
                <div className="pagination">
                  {/* Перша сторінка */}
                  <button
                    className={paymentPage === 1 ? 'active' : ''}
                    onClick={() => setPaymentPage(1)}
                  >
                    1
                  </button>

                  {/* ... після першої сторінки */}
                  {paymentPage > 4 && <span className="dots">...</span>}

                  {/* Поточне "вікно" */}
                  {Array.from({ length: totalPaymentPages }, (_, i) => i + 1)
                    .filter(
                      page =>
                        page !== 1 &&
                        page !== totalPaymentPages &&
                        page >= paymentPage - 2 &&
                        page <= paymentPage + 2
                    )
                    .map(page => (
                      <button
                        key={page}
                        className={paymentPage === page ? 'active' : ''}
                        onClick={() => setPaymentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                  {paymentPage < totalPaymentPages - 3 && <span className="dots">...</span>}
                  {totalPaymentPages > 1 && (
                    <button
                      className={paymentPage === totalPaymentPages ? 'active' : ''}
                      onClick={() => setPaymentPage(totalPaymentPages)}
                    >
                      {totalPaymentPages}
                    </button>
                  )}
                </div>

            </div>
            )}
        {activeSection === 'export' && (
          <ExportData
            orders={orders}
            drivers={drivers}
            vehicles={vehicles}
            payments={payments}
          />
        )}

      </main>
    </div>
  );
};

export default ManagerDashboard;
