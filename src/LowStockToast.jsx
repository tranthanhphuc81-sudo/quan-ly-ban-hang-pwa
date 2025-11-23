import React from 'react';

const LowStockToast = ({ lowStockProducts }) => {
  if (!lowStockProducts || lowStockProducts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: '#ff9800',
      color: '#fff',
      padding: '16px 24px',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 1000,
      fontWeight: 'bold',
    }}>
      <div>⚠️ Sản phẩm sắp hết hàng:</div>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {lowStockProducts.map(p => (
          <li key={p.id}>{p.name} (còn {p.stock} sản phẩm)</li>
        ))}
      </ul>
    </div>
  );
};

export default LowStockToast;
