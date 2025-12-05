import React, { useContext, useState } from 'react';
import OrderContext from '../OrderContext';

function DebtReport() {
  const { orders, setOrders } = useContext(OrderContext);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [sortBy, setSortBy] = useState('debt'); // 'debt', 'name', 'date'

  // Tổng hợp công nợ theo khách hàng
  const debtByCustomer = {};
  
  orders.forEach(order => {
    const customerName = order.buyer || 'Vãng lai';
    const debt = order.debt || 0;
    
    if (debt > 0) {
      if (!debtByCustomer[customerName]) {
        debtByCustomer[customerName] = {
          name: customerName,
          totalDebt: 0,
          orderCount: 0,
          orders: [],
          lastOrderDate: null
        };
      }
      
      debtByCustomer[customerName].totalDebt += debt;
      debtByCustomer[customerName].orderCount += 1;
      debtByCustomer[customerName].orders.push(order);
      
      const orderDate = new Date(order.createdAt);
      if (!debtByCustomer[customerName].lastOrderDate || orderDate > debtByCustomer[customerName].lastOrderDate) {
        debtByCustomer[customerName].lastOrderDate = orderDate;
      }
    }
  });

  // Chuyển thành mảng và lọc
  let customerList = Object.values(debtByCustomer).filter(customer => 
    customer.name.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  // Sắp xếp
  customerList.sort((a, b) => {
    if (sortBy === 'debt') return b.totalDebt - a.totalDebt;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'date') return b.lastOrderDate - a.lastOrderDate;
    return 0;
  });

  // Tổng công nợ toàn bộ
  const totalDebt = customerList.reduce((sum, c) => sum + c.totalDebt, 0);
  const totalCustomers = customerList.length;

  // Thanh toán đơn hàng
  const handlePayOrder = (orderId, customerName) => {
    if (!window.confirm('Đánh dấu đơn hàng này đã thanh toán đủ?')) return;
    
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          debt: 0,
          paid: true,
          cashPaid: o.cashPaid + (o.debt || 0),
          paidDate: new Date().toISOString()
        };
      }
      return o;
    });
    
    setOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
  };

  // Thanh toán một phần
  const handlePartialPayment = (orderId, customerName) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const amount = prompt(`Nhập số tiền thanh toán (Còn nợ: ${order.debt.toLocaleString()} VND):`);
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;
    
    const payAmount = parseFloat(amount);
    if (payAmount > order.debt) {
      alert('Số tiền thanh toán không thể lớn hơn số nợ!');
      return;
    }
    
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const newDebt = o.debt - payAmount;
        return {
          ...o,
          debt: newDebt,
          paid: newDebt === 0,
          cashPaid: o.cashPaid + payAmount,
          lastPaymentDate: new Date().toISOString()
        };
      }
      return o;
    });
    
    setOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
      <h2>📋 Báo cáo Công nợ</h2>

      {/* Thống kê tổng quan */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <strong>Tổng số khách hàng còn nợ:</strong>
            <span style={{ marginLeft: 8, fontSize: '1.2em', color: '#e74c3c', fontWeight: 'bold' }}>{totalCustomers}</span>
          </div>
        </div>
        <div>
          <strong>Tổng công nợ:</strong>
          <span style={{ marginLeft: 8, fontSize: '1.3em', color: '#e74c3c', fontWeight: 'bold' }}>{totalDebt.toLocaleString()} VND</span>
        </div>
      </div>

      {/* Bộ lọc và sắp xếp */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm khách hàng..."
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', fontSize: 15, borderRadius: 6, border: '1px solid #ddd' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setSortBy('debt')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: sortBy === 'debt' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f0f0f0',
              color: sortBy === 'debt' ? '#fff' : '#333',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Sắp xếp: Công nợ
          </button>
          <button
            onClick={() => setSortBy('name')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: sortBy === 'name' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f0f0f0',
              color: sortBy === 'name' ? '#fff' : '#333',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Sắp xếp: Tên
          </button>
          <button
            onClick={() => setSortBy('date')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: sortBy === 'date' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f0f0f0',
              color: sortBy === 'date' ? '#fff' : '#333',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Sắp xếp: Ngày gần nhất
          </button>
        </div>
      </div>

      {/* Danh sách khách hàng */}
      {customerList.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 8, padding: 32, textAlign: 'center', color: '#888' }}>
          {searchCustomer ? 'Không tìm thấy khách hàng' : 'Không có công nợ nào 🎉'}
        </div>
      ) : (
        customerList.map(customer => (
          <div key={customer.name} style={{ background: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '2px solid #f0f0f0', paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2em', color: '#2c3e50' }}>{customer.name}</h3>
                <div style={{ fontSize: '0.9em', color: '#888', marginTop: 4 }}>
                  {customer.orderCount} đơn hàng • Cập nhật: {customer.lastOrderDate.toLocaleDateString('vi-VN')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85em', color: '#888' }}>Tổng nợ:</div>
                <div style={{ fontSize: '1.4em', color: '#e74c3c', fontWeight: 'bold' }}>
                  {customer.totalDebt.toLocaleString()} VND
                </div>
              </div>
            </div>

            {/* Chi tiết các đơn hàng */}
            <div style={{ marginTop: 12 }}>
              <table style={{ width: '100%', fontSize: '0.9em', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '8px 4px', textAlign: 'left' }}>Mã đơn</th>
                    <th style={{ padding: '8px 4px', textAlign: 'right' }}>Tổng tiền</th>
                    <th style={{ padding: '8px 4px', textAlign: 'right' }}>Đã trả</th>
                    <th style={{ padding: '8px 4px', textAlign: 'right' }}>Còn nợ</th>
                    <th style={{ padding: '8px 4px', textAlign: 'center' }}>Ngày bán</th>
                    <th style={{ padding: '8px 4px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                      <td style={{ padding: '8px 4px' }}>{order.id}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>{order.total.toLocaleString()}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right', color: '#27ae60' }}>
                        {((order.cashPaid || 0) + (order.bankPaid || 0)).toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'right', color: '#e74c3c', fontWeight: 'bold' }}>
                        {(order.debt || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'center', fontSize: '0.85em' }}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '-'}
                        {order.createdTime && <div style={{ color: '#888' }}>{order.createdTime}</div>}
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                        <button
                          onClick={() => handlePartialPayment(order.id, customer.name)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.85em',
                            borderRadius: 4,
                            background: '#3498db',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            marginRight: 4
                          }}
                        >
                          Trả 1 phần
                        </button>
                        <button
                          onClick={() => handlePayOrder(order.id, customer.name)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.85em',
                            borderRadius: 4,
                            background: '#27ae60',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Trả hết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default DebtReport;
