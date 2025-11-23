import React, { useState } from 'react';
import { exportLocalStorage } from '../utils/exportData';
import { exportToExcel, importFromExcel } from '../utils/excelData';

function RecycleBin() {
  const [deletedProducts, setDeletedProducts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('deletedProducts') || '[]');
    } catch {
      return [];
    }
  });
  const [deletedOrders, setDeletedOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('deletedOrders') || '[]');
    } catch {
      return [];
    }
  });

  const restoreProduct = (id) => {
    const prod = deletedProducts.find(p => p.id === id);
    if (prod) {
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      localStorage.setItem('products', JSON.stringify([...products, prod]));
      const updated = deletedProducts.filter(p => p.id !== id);
      localStorage.setItem('deletedProducts', JSON.stringify(updated));
      setDeletedProducts(updated);
    }
  };
  const deleteProductForever = (id) => {
    if (window.confirm('Xoá vĩnh viễn sản phẩm này?')) {
      const updated = deletedProducts.filter(p => p.id !== id);
      localStorage.setItem('deletedProducts', JSON.stringify(updated));
      setDeletedProducts(updated);
    }
  };

  const restoreOrder = (id) => {
    const order = deletedOrders.find(o => o.id === id);
    if (order) {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      localStorage.setItem('orders', JSON.stringify([...orders, order]));
      const updated = deletedOrders.filter(o => o.id !== id);
      localStorage.setItem('deletedOrders', JSON.stringify(updated));
      setDeletedOrders(updated);
    }
  };
  const deleteOrderForever = (id) => {
    if (window.confirm('Xoá vĩnh viễn đơn hàng này?')) {
      const updated = deletedOrders.filter(o => o.id !== id);
      localStorage.setItem('deletedOrders', JSON.stringify(updated));
      setDeletedOrders(updated);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <h2>Khôi phục dữ liệu</h2>
      <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h4>Xuất dữ liệu</h4>
          <button style={{ marginBottom: 8, width: '100%' }} onClick={() => exportLocalStorage(['products', 'orders', 'deletedProducts', 'deletedOrders'], 'backup.json')}>Xuất file dữ liệu (JSON)</button>
          <button style={{ marginBottom: 8, width: '100%' }} onClick={() => exportToExcel(JSON.parse(localStorage.getItem('products') || '[]'), 'Sản phẩm', 'products.xlsx')}>Xuất Excel sản phẩm</button>
          <button style={{ marginBottom: 8, width: '100%' }} onClick={() => exportToExcel(JSON.parse(localStorage.getItem('orders') || '[]'), 'Đơn hàng', 'orders.xlsx')}>Xuất Excel đơn hàng</button>
          <button style={{ marginBottom: 8, width: '100%' }} onClick={() => exportToExcel(JSON.parse(localStorage.getItem('deletedProducts') || '[]'), 'Sản phẩm đã xoá', 'deletedProducts.xlsx')}>Xuất Excel sản phẩm đã xoá</button>
          <button style={{ marginBottom: 8, width: '100%' }} onClick={() => exportToExcel(JSON.parse(localStorage.getItem('deletedOrders') || '[]'), 'Đơn hàng đã xoá', 'deletedOrders.xlsx')}>Xuất Excel đơn hàng đã xoá</button>
        </div>
        <div style={{ flex: 1 }}>
          <h4>Nhập dữ liệu</h4>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <button type="button" style={{ width: '100%' }}>Nhập file dữ liệu (JSON)</button>
            <input
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = evt => {
                  try {
                    const data = JSON.parse(evt.target.result);
                    if (data.products) localStorage.setItem('products', JSON.stringify(data.products));
                    if (data.orders) localStorage.setItem('orders', JSON.stringify(data.orders));
                    if (data.deletedProducts) localStorage.setItem('deletedProducts', JSON.stringify(data.deletedProducts));
                    if (data.deletedOrders) localStorage.setItem('deletedOrders', JSON.stringify(data.deletedOrders));
                    alert('Khôi phục dữ liệu thành công! Vui lòng tải lại trang.');
                  } catch {
                    alert('File không hợp lệ!');
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <button type="button" style={{ width: '100%' }}>Nhập Excel sản phẩm</button>
            <input
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files[0];
                if (!file) return;
                importFromExcel(file, json => {
                  localStorage.setItem('products', JSON.stringify(json));
                  alert('Nhập Excel sản phẩm thành công! Vui lòng tải lại trang.');
                });
              }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <button type="button" style={{ width: '100%' }}>Nhập Excel đơn hàng</button>
            <input
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files[0];
                if (!file) return;
                importFromExcel(file, json => {
                  localStorage.setItem('orders', JSON.stringify(json));
                  alert('Nhập Excel đơn hàng thành công! Vui lòng tải lại trang.');
                });
              }}
            />
          </label>
        </div>
      </div>
      <h3>Sản phẩm đã xoá (có thể khôi phục)</h3>
      <table style={{ width: '100%', marginBottom: 24 }}>
        <thead>
          <tr>
            <th>Tên</th>
            <th>Barcode</th>
            <th>Ngày nhập</th>
            <th>Khôi phục</th>
            <th>Xoá vĩnh viễn</th>
          </tr>
        </thead>
        <tbody>
          {deletedProducts.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.barcode}</td>
              <td>{p.importDate || '-'}</td>
              <td><button onClick={() => restoreProduct(p.id)}>Khôi phục</button></td>
              <td><button onClick={() => deleteProductForever(p.id)}>Xoá vĩnh viễn</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Đơn hàng đã xoá (có thể khôi phục)</h3>
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Ngày bán</th>
            <th>Khôi phục</th>
            <th>Xoá vĩnh viễn</th>
          </tr>
        </thead>
        <tbody>
          {deletedOrders.map(o => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.createdAt ? o.createdAt.slice(0, 10) : '-'}</td>
              <td><button onClick={() => restoreOrder(o.id)}>Khôi phục</button></td>
              <td><button onClick={() => deleteOrderForever(o.id)}>Xoá vĩnh viễn</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecycleBin;
