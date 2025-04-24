import React from 'react';
import './PaymentsSection.css';

const PaymentsSection = ({ payments, paymentPage, totalPaymentPages, setPaymentPage, formatDate }) => {
  return (
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

      <div className="pagination">
        <button className={paymentPage === 1 ? 'active' : ''} onClick={() => setPaymentPage(1)}>1</button>

        {paymentPage > 4 && <span className="dots">...</span>}

        {Array.from({ length: totalPaymentPages }, (_, i) => i + 1)
          .filter(page => page !== 1 && page !== totalPaymentPages && page >= paymentPage - 2 && page <= paymentPage + 2)
          .map(page => (
            <button key={page} className={paymentPage === page ? 'active' : ''} onClick={() => setPaymentPage(page)}>
              {page}
            </button>
          ))}

        {paymentPage < totalPaymentPages - 3 && <span className="dots">...</span>}

        {totalPaymentPages > 1 && (
          <button className={paymentPage === totalPaymentPages ? 'active' : ''} onClick={() => setPaymentPage(totalPaymentPages)}>
            {totalPaymentPages}
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentsSection;
