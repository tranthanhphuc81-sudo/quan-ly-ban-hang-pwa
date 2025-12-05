import React, { useContext, useState } from 'react';
import OrderContext from '../OrderContext';
import ProductContext from '../ProductContext';

function Report() {
  const { orders, setOrders } = useContext(OrderContext);
  const { products, setProducts } = useContext(ProductContext);
  
  // State cho bộ lọc ngày
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [reportMode, setReportMode] = useState('today'); // 'today', 'range', 'all'
  
  // Tổng doanh thu toàn bộ
  const allRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  
  // Lọc đơn hàng theo chế độ
  let filteredOrders = orders;
  if (reportMode === 'today') {
    filteredOrders = orders.filter(o => o.createdAt && o.createdAt.slice(0, 10) === today);
  } else if (reportMode === 'range') {
    filteredOrders = orders.filter(o => {
      if (!o.createdAt) return false;
      const orderDate = o.createdAt.slice(0, 10);
      return orderDate >= dateFrom && orderDate <= dateTo;
    });
  }
  // reportMode === 'all' thì không lọc
  
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  
  // Tổng tiền mặt và chuyển khoản đã thu (hỗ trợ cả cấu trúc cũ và mới)
  const totalCash = filteredOrders.reduce((sum, o) => {
    // Cấu trúc mới: có cashPaid
    if (o.cashPaid !== undefined) return sum + (o.cashPaid || 0);
    // Cấu trúc cũ: dùng payMethod
    if (o.payMethod === 'cash') return sum + o.total;
    return sum;
  }, 0);
  
  const totalBank = filteredOrders.reduce((sum, o) => {
    // Cấu trúc mới: có bankPaid
    if (o.bankPaid !== undefined) return sum + (o.bankPaid || 0);
    // Cấu trúc cũ: dùng payMethod
    if (o.payMethod === 'bank') return sum + o.total;
    return sum;
  }, 0);
  
  // Tổng công nợ còn lại
  const totalDebt = filteredOrders.reduce((sum, o) => sum + (o.debt || 0), 0);
  
  // Tính lợi nhuận nếu có giá vốn
  const totalProfit = filteredOrders.reduce((sum, o) => sum + o.items.reduce((pSum, item) => {
    const prod = products.find(p => p.id === item.id);
    return pSum + (item.price - (prod?.cost || 0)) * item.qty;
  }, 0), 0);
  // Low stock warning
  const lowStock = products ? products.filter(p => p.stock <= 3) : [];
  // Tổng giá vốn tồn kho
  const totalInventoryCost = products ? products.reduce((sum, p) => sum + (p.cost || 0) * (p.stock || 0), 0) : 0;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <h2>Báo cáo ngày</h2>
      
      {/* Bộ lọc thời gian */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Chọn khoảng thời gian</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <button 
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: reportMode === 'today' ? 'none' : '1px solid #ddd',
              background: reportMode === 'today' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
              color: reportMode === 'today' ? '#fff' : '#333',
              cursor: 'pointer'
            }}
            onClick={() => setReportMode('today')}
          >
            Hôm nay
          </button>
          <button 
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: reportMode === 'range' ? 'none' : '1px solid #ddd',
              background: reportMode === 'range' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
              color: reportMode === 'range' ? '#fff' : '#333',
              cursor: 'pointer'
            }}
            onClick={() => setReportMode('range')}
          >
            Theo khoảng
          </button>
          <button 
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: reportMode === 'all' ? 'none' : '1px solid #ddd',
              background: reportMode === 'all' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
              color: reportMode === 'all' ? '#fff' : '#333',
              cursor: 'pointer'
            }}
            onClick={() => setReportMode('all')}
          >
            Tất cả
          </button>
          
          {reportMode === 'range' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label>Từ:</label>
                <input 
                  type="date" 
                  value={dateFrom} 
                  onChange={(e) => setDateFrom(e.target.value)}
                  max={dateTo}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label>Đến:</label>
                <input 
                  type="date" 
                  value={dateTo} 
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>
            </>
          )}
        </div>
        {reportMode === 'today' && <div style={{ fontSize: '14px', color: '#666' }}>Hiển thị đơn hàng hôm nay</div>}
        {reportMode === 'range' && <div style={{ fontSize: '14px', color: '#666' }}>Hiển thị đơn hàng từ {dateFrom} đến {dateTo}</div>}
        {reportMode === 'all' && <div style={{ fontSize: '14px', color: '#666' }}>Hiển thị tất cả đơn hàng</div>}
      </div>
      
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div><strong>Tổng doanh thu toàn bộ:</strong> {allRevenue.toLocaleString()} VND</div>
      </div>
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div><strong>Tổng số đơn hàng:</strong> {totalOrders}</div>
        <div>
          <strong>Tổng doanh thu:</strong> {totalRevenue.toLocaleString()} VND
        </div>
        <div style={{ color: '#2ecc71' }}>
          <strong>Tiền mặt đã thu:</strong> {totalCash.toLocaleString()} VND
        </div>
        <div style={{ color: '#3498db' }}>
          <strong>Tiền chuyển khoản đã nhận:</strong> {totalBank.toLocaleString()} VND
        </div>
        <div style={{ color: totalDebt > 0 ? '#e74c3c' : '#27ae60' }}>
          <strong>Công nợ còn lại:</strong> {totalDebt.toLocaleString()} VND
        </div>
        <div><strong>Tổng lợi nhuận:</strong> {totalProfit.toLocaleString()} VND</div>
        {lowStock.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <strong style={{ color: 'red' }}>Cảnh báo sắp hết hàng:</strong>
            <ul>
              {lowStock.map(p => (
                <li key={p.id}>
                  {p.name} (còn {p.stock})
                  {p.importDate && (
                    <span style={{ color: '#888', marginLeft: 8 }}>
                      - nhập: {p.importDate}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div style={{ background: '#fff', borderRadius: 8, padding: 16 }}>
        <h3>Báo cáo tồn kho</h3>
        <div><strong>Tổng giá vốn hàng tồn kho:</strong> {totalInventoryCost.toLocaleString()} VND</div>
        <table style={{ width: '100%', marginTop: 12, background: '#f9f9f9', borderRadius: 8 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Tên hàng</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Tồn kho</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Giá vốn</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Thành tiền</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Ngày nhập</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Người cung cấp</th>
            </tr>
          </thead>
          <tbody>
            {products && products.map(p => (
              <tr key={p.id}>
                <td style={{ padding: 8 }}>{p.name}</td>
                <td style={{ textAlign: 'right', padding: 8 }}>{p.stock}</td>
                <td style={{ textAlign: 'right', padding: 8 }}>{(p.cost || 0).toLocaleString()} VND</td>
                <td style={{ textAlign: 'right', padding: 8 }}>{((p.cost || 0) * (p.stock || 0)).toLocaleString()} VND</td>
                <td style={{ textAlign: 'right', padding: 8 }}>
                  {p.importDate || '-'}
                  {p.importTime && <div style={{ fontSize: '0.85em', color: '#888' }}>{p.importTime}</div>}
                </td>
                <td style={{ padding: 8 }}>{p.supplier || 'Vãng lai'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, marginTop: 16 }}>
        <h3>
          {reportMode === 'today' && 'Đơn hàng hôm nay'}
          {reportMode === 'range' && `Đơn hàng từ ${dateFrom} đến ${dateTo}`}
          {reportMode === 'all' && 'Tất cả đơn hàng'}
        </h3>
        <table style={{ width: '100%', marginTop: 12, background: '#f9f9f9', borderRadius: 8 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Mã đơn</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Ngày bán</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Tiền mặt</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Chuyển khoản</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Người mua</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Sản phẩm</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Công nợ</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td style={{ padding: 8 }}>{order.id}</td>
                <td style={{ textAlign: 'right', padding: 8 }}>
                  {order.createdAt ? order.createdAt.slice(0, 10) : '-'}
                  {order.createdTime && <div style={{ fontSize: '0.85em', color: '#888' }}>{order.createdTime}</div>}
                </td>
                <td style={{ textAlign: 'right', padding: 8, color: '#2ecc71' }}>
                  {order.cashPaid !== undefined 
                    ? (order.cashPaid > 0 ? order.cashPaid.toLocaleString() + ' VND' : '-')
                    : (order.payMethod === 'cash' ? order.total.toLocaleString() + ' VND' : '-')
                  }
                </td>
                <td style={{ textAlign: 'right', padding: 8, color: '#3498db' }}>
                  {order.bankPaid !== undefined
                    ? (order.bankPaid > 0 ? order.bankPaid.toLocaleString() + ' VND' : '-')
                    : (order.payMethod === 'bank' ? order.total.toLocaleString() + ' VND' : '-')
                  }
                </td>
                <td style={{ padding: 8 }}>{order.buyer || 'Vãng lai'}</td>
                <td style={{ padding: 8 }}>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {order.items.map(item => (
                      <li key={item.id}>
                        {item.name} x {item.qty}
                        {item.importDate && (
                          <span style={{ color: '#888', marginLeft: 8 }}>
                            (Nhập: {item.importDate})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <button
                    style={{ marginTop: 8 }}
                    onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn xoá đơn hàng này?')) {
                        // Hoàn lại số lượng sản phẩm vào kho
                        const updatedProducts = products.map(p => {
                          const orderItem = order.items.find(item => item.id === p.id);
                          if (orderItem) {
                            return { ...p, stock: p.stock + orderItem.qty };
                          }
                          return p;
                        });
                        setProducts(updatedProducts);
                        localStorage.setItem('products', JSON.stringify(updatedProducts));
                        
                        // Lưu vào thùng rác
                        const deleted = JSON.parse(localStorage.getItem('deletedOrders') || '[]');
                        localStorage.setItem('deletedOrders', JSON.stringify([...deleted, order]));
                        
                        // Xoá đơn hàng khỏi danh sách
                        const newOrders = orders.filter(o => o.id !== order.id);
                        setOrders(newOrders);
                        localStorage.setItem('orders', JSON.stringify(newOrders));
                      }
                    }}>
                    Xoá
                  </button>
                </td>
                <td style={{ textAlign: 'right', padding: 8 }}>
                  {order.debt !== undefined ? (
                    order.debt > 0 ? (
                      <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{order.debt.toLocaleString()} VND</span>
                    ) : (
                      <span style={{ color: '#27ae60' }}>-</span>
                    )
                  ) : (
                    <span style={{ color: '#27ae60' }}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default Report;
