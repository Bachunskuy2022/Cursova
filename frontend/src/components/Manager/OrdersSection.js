import React from 'react';
import LocationAutocomplete from './LocationAutocomplete';
import './OrdersSection.css';
import './OrderCard.css';
import { getAvatarUrl } from '/Універ/Курсова БД/frontend/src/Util/getAvatarUrl';

const highlightMatch = (text, query) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  const parts = String(text).split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} style={{ backgroundColor: '#facc15', padding: '0 2px' }}>{part}</mark> : part
  );
};

const OrdersSection = ({
  orders,
  currentPage,
  setCurrentPage,
  showNewOrderForm,
  setShowNewOrderForm,
  newOrder,
  setNewOrder,
  clients,
  employees,
  uploadRef,
  downloadRef,
  handleCreateOrder,
  searchClient,
  setSearchClient,
  showClientList,
  setShowClientList,
  searchEmployee,
  setSearchEmployee,
  showEmployeeList,
  setShowEmployeeList,
  searchTerm,
  setSearchTerm,
  formatDate
}) => {
  const recordsPerPage = 50;

  const filteredOrders = orders.filter(order => {
    const query = searchTerm.toLowerCase();
    return (
      order.OrderNumber?.toString().includes(query) ||
      order.ClientName?.toLowerCase().includes(query) ||
      order.EmployeeName?.toLowerCase().includes(query) ||
      order.StatusName?.toLowerCase().includes(query) ||
      order.UploadLocation?.toLowerCase().includes(query) ||
      order.DownloadLocation?.toLowerCase().includes(query) ||
     
      order.OrderDate?.toLowerCase().includes(query) ||
      order.StartTime?.toLowerCase().includes(query) ||
      order.EndTime?.toLowerCase().includes(query) ||
      order.StatusName?.toLowerCase().includes(query) ||
      String(order.Price || '').toLowerCase().includes(query)||
      String(order.Distance || '').toLowerCase().includes(query)||
      String(order.DeliveryTime || '').toLowerCase().includes(query)||
      order.LicensePlate?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / recordsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);
  
  return (
    <>
      <div className="cards">
        <div className="card"><p>Кількість замовлень</p><strong>{filteredOrders.length}</strong></div>
        <div className="card"><p>Completed</p><strong>–</strong></div>
        <div className="card"><p>In Progress</p><strong>–</strong></div>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h2>Усі замовлення</h2>
          <input
            type="text"
            placeholder="Пошук..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <button onClick={() => setShowNewOrderForm(true)} className="add-button">+ Нове замовлення</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="order-card-container">
            {paginatedOrders.map(order => (
              <div key={order.id} className="order-card">
                <h2>#{highlightMatch(order.OrderNumber,searchTerm)} — {highlightMatch(order.ClientName,searchTerm)}</h2>
                <div className="order-grid">
                <div className="order-block">
                    <p className="order-meta">📌 <strong>Дата створення</strong></p>
                    <p>{highlightMatch(formatDate(order.OrderDate), searchTerm)}</p>
                    <p className="order-meta">📅 <strong>Початок виконання:</strong></p>
                    <p>{highlightMatch(order.StartTime ? formatDate(order.StartTime) : '—', searchTerm)}</p>
                    <p className="order-meta">📅 <strong>Завершення виконання:</strong></p>
                    <p>{highlightMatch(order.EndTime ? formatDate(order.EndTime) : '—', searchTerm)}</p>

                  </div>
                  <div className="order-block text-right">
                    <p className="order-meta">💰<strong> Вартість:</strong> {highlightMatch(order.Price, searchTerm)} ₴</p>
                    <p className="order-meta">🚣<strong> Відстань:</strong> {highlightMatch(order.Distance, searchTerm)} км</p>
                    <p className="order-meta">⏱<strong> Час доставки:</strong> {highlightMatch(order.DeliveryTime, searchTerm)} год</p>
                    <p className="order-meta">🚚 <strong>Автомобіль:</strong> {highlightMatch(order.LicensePlate || '—', searchTerm)}</p>
                    <p className="order-meta">📊<strong> Статус замовлення</strong></p>
                    <span className="status-label">{highlightMatch(order.StatusName, searchTerm)}</span>
                  </div>
                  <div className="order-block">
                  <p className="order-meta">👷 <strong>Працівник</strong></p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {order.EmployeeEmail && (
                      <img
                        src={getAvatarUrl(order.EmployeeEmail)}
                        alt="avatar"
                        style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                      />
                    )}
                    <span>{order.EmployeeName || '—'}</span>
                  </div>


                    <p className="order-meta"><strong>Товари</strong></p>
                    {order.Products && (
                      <ul style={{ paddingLeft: '1rem' }}>
                        {(Array.isArray(order.Products) ? order.Products : order.Products.split(', ')).map((product, i) => (
                          <li key={i}>{highlightMatch(product, searchTerm)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="order-block text-right">
                    <p className="order-meta">📦 <strong>Завантаження</strong></p>
                    <p>{highlightMatch(order.UploadLocation, searchTerm)}</p>
                    <p className="order-meta mt-2">🏁 <strong>Розвантаження</strong></p>
                    <p>{highlightMatch(order.DownloadLocation, searchTerm)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pagination">
          {totalPages > 1 && (
            <>
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

              {totalPages !== 1 && (
                <button
                  className={currentPage === totalPages ? 'active' : ''}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </button>
              )}
            </>
          )}
        </div>


      </div>

      {showNewOrderForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Нове замовлення</h3>
            <div className="form-grid">
              <input type="text" placeholder="Номер замовлення" value={newOrder.orderNumber || ''} readOnly />
              <input type="text" placeholder="Час доставки" onChange={(e) => setNewOrder({ ...newOrder, deliveryTime: e.target.value })} />
              <input type="number" placeholder="Ціна" onChange={(e) => setNewOrder({ ...newOrder, price: e.target.value })} />
              <input type="number" placeholder="Відстань" onChange={(e) => setNewOrder({ ...newOrder, distance: e.target.value })} />
              <div className="autocomplete">
                <input type="text" placeholder="Введіть ім’я або прізвище клієнта" value={searchClient} onChange={(e) => { setSearchClient(e.target.value); setShowClientList(true); }} onBlur={() => setTimeout(() => setShowClientList(false), 200)} />
                {showClientList && (
                  <ul className="autocomplete-list">
                    {clients.filter(c => { const [surname, name] = c.FullName.toLowerCase().split(' '); const query = searchClient.toLowerCase(); return surname.startsWith(query) || name.startsWith(query); }).map(c => (
                      <li key={c.ClientId} onClick={() => { setNewOrder({ ...newOrder, clientId: c.ClientId }); setSearchClient(c.FullName); setShowClientList(false); }}>{c.FullName}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="autocomplete">
                <input type="text" placeholder="Введіть ім’я або прізвище працівника" value={searchEmployee} onChange={(e) => { setSearchEmployee(e.target.value); setShowEmployeeList(true); }} onBlur={() => setTimeout(() => setShowEmployeeList(false), 200)} />
                {showEmployeeList && (
                  <ul className="autocomplete-list">
                    {employees.filter(e => { const [surname, name] = e.FullName.toLowerCase().split(' '); const query = searchEmployee.toLowerCase(); return surname.startsWith(query) || name.startsWith(query); }).map(e => (
                      <li key={e.EmployeeId} onClick={() => { setNewOrder({ ...newOrder, employeeId: e.EmployeeId }); setSearchEmployee(e.FullName); setShowEmployeeList(false); }}>{e.FullName}</li>
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
    </>
  );
};

export default OrdersSection;