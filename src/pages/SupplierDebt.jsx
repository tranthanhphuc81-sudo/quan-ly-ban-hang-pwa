import React, { useState, useEffect } from 'react';

function SupplierDebt() {
  const [imports, setImports] = useState([]);
  const [searchSupplier, setSearchSupplier] = useState('');
  const [sortBy, setSortBy] = useState('debt'); // 'debt', 'name', 'date'

  useEffect(() => {
    loadImports();
  }, []);

  const loadImports = () => {
    const data = JSON.parse(localStorage.getItem('imports') || '[]');
    setImports(data);
  };

  // Tổng hợp công nợ theo nhà cung cấp
  const debtBySupplier = {};
  
  imports.forEach(imp => {
    const supplierName = imp.supplier || 'Vãng lai';
    
    if (imp.debtAmount > 0 && !imp.paid) {
      if (!debtBySupplier[supplierName]) {
        debtBySupplier[supplierName] = {
          name: supplierName,
          totalDebt: 0,
          importCount: 0,
          imports: [],
          lastImportDate: null
        };
      }
      
      debtBySupplier[supplierName].totalDebt += imp.debtAmount;
      debtBySupplier[supplierName].importCount += 1;
      debtBySupplier[supplierName].imports.push(imp);
      
      const impDate = new Date(imp.importDate);
      if (!debtBySupplier[supplierName].lastImportDate || impDate > debtBySupplier[supplierName].lastImportDate) {
        debtBySupplier[supplierName].lastImportDate = impDate;
      }
    }
  });

  // Chuyển thành mảng và sắp xếp
  let supplierList = Object.values(debtBySupplier);
  
  // Lọc theo tên nhà cung cấp
  if (searchSupplier.trim()) {
    supplierList = supplierList.filter(s => 
      s.name.toLowerCase().includes(searchSupplier.toLowerCase())
    );
  }
  
  // Sắp xếp
  supplierList.sort((a, b) => {
    if (sortBy === 'debt') return b.totalDebt - a.totalDebt;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'date') {
      if (!a.lastImportDate) return 1;
      if (!b.lastImportDate) return -1;
      return b.lastImportDate - a.lastImportDate;
    }
    return 0;
  });

  // Thanh toán toàn bộ công nợ của một lần nhập hàng
  const handlePayImport = (impId) => {
    const imp = imports.find(i => i.id === impId);
    if (!imp) return;
    
    const updatedImports = imports.map(i => {
      if (i.id === impId) {
        return {
          ...i,
          paidAmount: i.totalCost,
          debtAmount: 0,
          paid: true,
          paidDate: new Date().toISOString().slice(0, 10),
          paidTime: new Date().toLocaleTimeString('vi-VN')
        };
      }
      return i;
    });
    
    localStorage.setItem('imports', JSON.stringify(updatedImports));
    setImports(updatedImports);
  };

  // Thanh toán một phần công nợ
  const handlePartialPayment = (impId) => {
    const imp = imports.find(i => i.id === impId);
    if (!imp) return;
    
    const amount = prompt(`Số tiền thanh toán (Còn nợ: ${imp.debtAmount.toLocaleString()}đ):`);
    if (!amount) return;
    
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      alert('Số tiền không hợp lệ!');
      return;
    }
    
    if (payAmount > imp.debtAmount) {
      alert('Số tiền thanh toán không được vượt quá số nợ!');
      return;
    }
    
    const updatedImports = imports.map(i => {
      if (i.id === impId) {
        const newPaidAmount = i.paidAmount + payAmount;
        const newDebtAmount = i.debtAmount - payAmount;
        return {
          ...i,
          paidAmount: newPaidAmount,
          debtAmount: newDebtAmount,
          paid: newDebtAmount === 0,
          lastPaymentDate: new Date().toISOString().slice(0, 10),
          lastPaymentTime: new Date().toLocaleTimeString('vi-VN')
        };
      }
      return i;
    });
    
    localStorage.setItem('imports', JSON.stringify(updatedImports));
    setImports(updatedImports);
  };

  const totalAllDebt = supplierList.reduce((sum, s) => sum + s.totalDebt, 0);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <h2>Công nợ phải trả nhà cung cấp</h2>
      
      <div style={{ 
        marginBottom: 20, 
        padding: 16, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 12,
        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{ fontSize: '0.95em', opacity: 0.9, marginBottom: 4 }}>Tổng công nợ</div>
        <div style={{ fontSize: '2em', fontWeight: 700 }}>{totalAllDebt.toLocaleString()}đ</div>
        <div style={{ fontSize: '0.9em', opacity: 0.85, marginTop: 4 }}>
          {supplierList.length} nhà cung cấp
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Tìm theo tên nhà cung cấp..."
          value={searchSupplier}
          onChange={e => setSearchSupplier(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: 10, fontSize: 15, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: 10, fontSize: 15, borderRadius: 8, border: '1px solid #ddd', minWidth: 150 }}
        >
          <option value="debt">Sắp xếp: Nợ nhiều nhất</option>
          <option value="name">Sắp xếp: Tên A-Z</option>
          <option value="date">Sắp xếp: Nhập gần nhất</option>
        </select>
      </div>

      {supplierList.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          background: '#f9fafb', 
          borderRadius: 12,
          color: '#6b7280'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Không có công nợ</div>
          <div style={{ marginTop: 8, fontSize: 14 }}>Bạn đã thanh toán đủ tất cả nhà cung cấp</div>
        </div>
      ) : (
        supplierList.map(supplier => (
          <div
            key={supplier.name}
            style={{
              marginBottom: 24,
              padding: 16,
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 12,
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(102, 126, 234, 0.15)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: '2px solid #e5e7eb'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3em', color: '#667eea' }}>{supplier.name}</h3>
                <div style={{ fontSize: '0.9em', color: '#6b7280', marginTop: 4 }}>
                  {supplier.importCount} lần nhập hàng
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85em', color: '#6b7280' }}>Tổng nợ</div>
                <div style={{ fontSize: '1.5em', fontWeight: 700, color: '#dc2626' }}>
                  {supplier.totalDebt.toLocaleString()}đ
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.95em'
              }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: 10, textAlign: 'left', fontWeight: 600 }}>Sản phẩm</th>
                    <th style={{ padding: 10, textAlign: 'center', fontWeight: 600 }}>Số lượng</th>
                    <th style={{ padding: 10, textAlign: 'right', fontWeight: 600 }}>Tổng tiền</th>
                    <th style={{ padding: 10, textAlign: 'right', fontWeight: 600 }}>Đã trả</th>
                    <th style={{ padding: 10, textAlign: 'right', fontWeight: 600 }}>Còn nợ</th>
                    <th style={{ padding: 10, textAlign: 'center', fontWeight: 600 }}>Ngày nhập</th>
                    <th style={{ padding: 10, textAlign: 'center', fontWeight: 600 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {supplier.imports.map(imp => (
                    <tr key={imp.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: 10 }}>{imp.productName}</td>
                      <td style={{ padding: 10, textAlign: 'center' }}>{imp.quantity}</td>
                      <td style={{ padding: 10, textAlign: 'right', fontWeight: 600 }}>
                        {imp.totalCost.toLocaleString()}đ
                      </td>
                      <td style={{ padding: 10, textAlign: 'right', color: '#059669' }}>
                        {imp.paidAmount.toLocaleString()}đ
                      </td>
                      <td style={{ padding: 10, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                        {imp.debtAmount.toLocaleString()}đ
                      </td>
                      <td style={{ padding: 10, textAlign: 'center', fontSize: '0.9em', color: '#6b7280' }}>
                        {imp.importDate}
                        {imp.importTime && <div style={{ fontSize: '0.85em' }}>{imp.importTime}</div>}
                      </td>
                      <td style={{ padding: 10, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            onClick={() => handlePartialPayment(imp.id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.85em',
                              borderRadius: 6,
                              border: 'none',
                              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Trả 1 phần
                          </button>
                          <button
                            onClick={() => handlePayImport(imp.id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.85em',
                              borderRadius: 6,
                              border: 'none',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Trả hết
                          </button>
                        </div>
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

export default SupplierDebt;
