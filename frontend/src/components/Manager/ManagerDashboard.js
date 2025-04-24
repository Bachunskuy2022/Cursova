import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ManagerDashboard.css';
import { useNavigate } from 'react-router-dom';
import ExportData from './ExportData';
import OrdersSection from './OrdersSection';
import DriversSection from './DriversSection';
import VehiclesSection from './VehiclesSection';
import PaymentsSection from './PaymentsSection';

const formatDate = (isoString) => {
  if (!isoString) return '—'; // 👈 додано захист
  const date = new Date(isoString);
  if (isNaN(date)) return '—'; // 👈 додано перевірку валідності
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
  const [searchTerm, setSearchTerm] = useState('');
  const [recordsPerPage] = useState(50);

  const [newOrder, setNewOrder] = useState({
    orderNumber: '', orderDate: '', deliveryTime: '', price: '', distance: '',
    clientId: '', employeeId: '', uploadLocationId: '', downloadLocationId: '', statusId: 1
  });

  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeSection, setActiveSection] = useState('orders');
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

  const uploadRef = useRef();
  const downloadRef = useRef();

  useEffect(() => {
    axios.get('http://localhost:5000/clients').then(res => setClients(res.data));
    axios.get('http://localhost:5000/employees').then(res => setEmployees(res.data));
    axios.get('http://localhost:5000/orders/last-number')
      .then(res => {
        const nextNumber = parseInt(res.data.lastNumber || 0) + 1;
        setNewOrder(order => ({ ...order, orderNumber: nextNumber }));
      });
  }, []);

  useEffect(() => {
    if (activeSection === 'orders') {
      axios.get('http://localhost:5000/orders')
        .then(res => setOrders(res.data.orders))
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
          setPayments(res.data.payments);
          setTotalPaymentPages(Math.ceil(res.data.total / recordsPerPage));
        })
        .catch(err => console.error('Помилка отримання оплат:', err));
    }
  }, [activeSection, searchTerm, paymentPage]);

  const filteredOrders = searchTerm
  ? orders.filter(order => {
      const query = searchTerm.toLowerCase();
      return (
        order.OrderNumber?.toString().toLowerCase().includes(query) ||
        order.ClientName?.toLowerCase().includes(query) ||
        order.EmployeeName?.toLowerCase().includes(query) ||
        order.StatusName?.toLowerCase().includes(query) ||
        order.UploadLocation?.toLowerCase().includes(query) ||
        order.DownloadLocation?.toLowerCase().includes(query)
      );
    })
  : orders;

const totalOrdersCount = filteredOrders.length;
const totalPages = Math.ceil(totalOrdersCount / recordsPerPage);
const startIndex = (currentPage - 1) * recordsPerPage;
const paginatedOrders = filteredOrders.slice(startIndex, startIndex + recordsPerPage);


  const handleCreateOrder = async () => {
    try {
      const uploadData = uploadRef.current.getLocationData();
      const downloadData = downloadRef.current.getLocationData();
      const uploadResponse = await axios.post('http://localhost:5000/locations/smart-add', uploadData);
      const downloadResponse = await axios.post('http://localhost:5000/locations/smart-add', downloadData);
      const uploadLocationId = uploadResponse.data.locationId;
      const downloadLocationId = downloadResponse.data.locationId;
      const finalOrder = { ...newOrder, uploadLocationId, downloadLocationId };
      await axios.post('http://localhost:5000/orders', finalOrder);
      setShowNewOrderForm(false);
      setNewOrder({});
      const refreshed = await axios.get('http://localhost:5000/orders');
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
  console.log('Всього замовлень:', orders.length);
  console.log('Після фільтрації:', filteredOrders.length);
  console.log('Зараз відображається:', paginatedOrders.length);
  console.log('Пошук за:', searchTerm);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo">TransWay</div>
        <ul className="menu">
          <li className={activeSection === 'orders' ? 'active' : ''} onClick={() => setActiveSection('orders')}>Замовлення</li>
          <li className={activeSection === 'drivers' ? 'active' : ''} onClick={() => setActiveSection('drivers')}>Водії</li>
          <li className={activeSection === 'vehicles' ? 'active' : ''} onClick={() => setActiveSection('vehicles')}>Автопарк</li>
          <li className={activeSection === 'payments' ? 'active' : ''} onClick={() => setActiveSection('payments')}>Оплати</li>
          <li className={activeSection === 'export' ? 'active' : ''} onClick={() => setActiveSection('export')}>Експорт даних</li>
        </ul>
        <button className="logout-button" onClick={handleLogout}>
          <img src="https://www.svgrepo.com/show/532551/logout-1.svg" alt="logout" className="logout-icon" /> Logout
        </button>
      </aside>

      <main className="main-content">
        <h1>Привіт, Менеджере 👋</h1>

        {activeSection === 'export' && (
          <ExportData orders={orders} drivers={drivers} vehicles={vehicles} payments={payments} />
        )}

        {activeSection === 'orders' && (
          <OrdersSection
            orders={orders}
            totalOrdersCount={totalOrdersCount}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            showNewOrderForm={showNewOrderForm}
            setShowNewOrderForm={setShowNewOrderForm}
            newOrder={newOrder}
            setNewOrder={setNewOrder}
            clients={clients}
            employees={employees}
            uploadRef={uploadRef}
            downloadRef={downloadRef}
            handleCreateOrder={handleCreateOrder}
            searchClient={searchClient}
            setSearchClient={setSearchClient}
            showClientList={showClientList}
            setShowClientList={setShowClientList}
            searchEmployee={searchEmployee}
            setSearchEmployee={setSearchEmployee}
            showEmployeeList={showEmployeeList}
            setShowEmployeeList={setShowEmployeeList}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            formatDate={formatDate}
          />
        )}

        {activeSection === 'drivers' && (
          <DriversSection
            drivers={drivers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showAddForm={showAddForm}
            setShowAddForm={setShowAddForm}
            newDriver={newDriver}
            setNewDriver={setNewDriver}
            handleAddDriver={handleAddDriver}
          />
        )}

        {activeSection === 'vehicles' && (
          <VehiclesSection vehicles={vehicles} selectedVehicle={selectedVehicle} setSelectedVehicle={setSelectedVehicle} />
        )}

        {activeSection === 'payments' && (
          <PaymentsSection payments={payments} paymentPage={paymentPage} totalPaymentPages={totalPaymentPages} setPaymentPage={setPaymentPage} formatDate={formatDate} />
        )}
      </main>
    </div>
  );
};

export default ManagerDashboard;
