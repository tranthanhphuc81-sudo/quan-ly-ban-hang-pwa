import React, { useContext } from 'react';
import OrderContext from '../OrderContext';
import ProductContext from '../ProductContext';

function Report() {
  const { orders } = useContext(OrderContext);
  const { products } = useContext(ProductContext);
  // Tổng doanh thu toàn bộ
  const allRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  // Lọc đơn hàng trong ngày
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => o.createdAt && o.createdAt.slice(0, 10) === today);
  const totalOrders = todayOrders.length;
  const totalRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  // Tính lợi nhuận nếu có giá vốn
  const totalProfit = todayOrders.reduce((sum, o) => sum + o.items.reduce((pSum, item) => {
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
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div><strong>Tổng doanh thu toàn bộ:</strong> {allRevenue.toLocaleString()} VND</div>
      </div>
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div><strong>Tổng số đơn hàng hôm nay:</strong> {totalOrders}</div>
        <div><strong>Tổng doanh thu hôm nay:</strong> {totalRevenue.toLocaleString()} VND</div>
        <div><strong>Tổng lợi nhuận hôm nay:</strong> {totalProfit.toLocaleString()} VND</div>
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
                <td style={{ textAlign: 'right', padding: 8 }}>{p.importDate || '-'}</td>
                <td style={{ padding: 8 }}>{p.supplier || 'Vãng lai'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, marginTop: 16 }}>
        <h3>Đơn hàng hôm nay</h3>
        <table style={{ width: '100%', marginTop: 12, background: '#f9f9f9', borderRadius: 8 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Mã đơn</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Ngày bán</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Tổng tiền</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Người mua</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Sản phẩm</th>
            </tr>
          </thead>
          <tbody>
            {todayOrders.map(order => (
              <tr key={order.id}>
                <td style={{ padding: 8 }}>{order.id}</td>
                <td style={{ textAlign: 'right', padding: 8 }}>{order.createdAt ? order.createdAt.slice(0, 10) : '-'}</td>
                <td style={{ textAlign: 'right', padding: 8 }}>{order.total.toLocaleString()} VND</td>
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
                        // Lưu vào thùng rác
                        const deleted = JSON.parse(localStorage.getItem('deletedOrders') || '[]');
                        localStorage.setItem('deletedOrders', JSON.stringify([...deleted, order]));
                        const { setOrders, orders } = require('../OrderContext');
                        // Xoá khỏi danh sách đơn hàng
                        setOrders(orders.filter(o => o.id !== order.id));
                        window.location.reload();
                      }
                    }}
                  >Xóa đơn</button>
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
