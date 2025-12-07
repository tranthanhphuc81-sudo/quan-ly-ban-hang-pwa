import React, { useState, useContext } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import ProductContext from '../ProductContext';

function Catalog() {
  const { products, setProducts } = useContext(ProductContext);
  // Lấy ngày hiện tại theo định dạng YYYY-MM-DD
  const getTodayDate = () => new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ name: '', barcode: '', price: '', cost: '', stock: '', category: '', importDate: getTodayDate(), supplier: '', paidAmount: '' });
  const [editingId, setEditingId] = useState(null);


  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Quét mã vạch bằng camera
  const handleScanBarcode = async () => {
    const qrRegionId = 'qr-reader';
    const html5QrCode = new Html5Qrcode(qrRegionId);
    document.getElementById(qrRegionId).style.display = 'block';
    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          setForm(f => ({ ...f, barcode: decodedText }));
          html5QrCode.stop();
          document.getElementById(qrRegionId).style.display = 'none';
        },
        (errorMessage) => {}
      );
    } catch (err) {
      alert('Không thể mở camera hoặc quét mã vạch!');
      document.getElementById(qrRegionId).style.display = 'none';
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name || !form.barcode || !form.price) {
      alert('Vui lòng nhập đủ Tên, Mã vạch và Giá bán!');
      return;
    }
    const supplier = form.supplier && form.supplier.trim() ? form.supplier : 'Vãng lai';
    const now = new Date();
    const importTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Tính toán tổng giá trị nhập và công nợ
    const totalCost = (+form.cost || 0) * (+form.stock || 0);
    const paidAmount = +form.paidAmount || 0;
    const debtAmount = totalCost - paidAmount;
    
    if (editingId) {
      setProducts(products.map(p => p.id === editingId ? { ...p, ...form, supplier, price: +form.price, cost: +form.cost || 0, stock: +form.stock || 0, category: form.category, importDate: form.importDate || now.toISOString().slice(0, 10), importTime } : p));
    } else {
      const importDate = form.importDate || now.toISOString().slice(0, 10);
      
      // Lưu thông tin nhập hàng vào localStorage để theo dõi công nợ
      if (totalCost > 0 && supplier !== 'Vãng lai') {
        const imports = JSON.parse(localStorage.getItem('imports') || '[]');
        imports.push({
          id: Date.now(),
          supplier,
          productName: form.name,
          quantity: +form.stock || 0,
          totalCost,
          paidAmount,
          debtAmount,
          importDate,
          importTime,
          paid: debtAmount === 0
        });
        localStorage.setItem('imports', JSON.stringify(imports));
      }
      
      // Tìm sản phẩm trùng
      const existed = products.find(p =>
        p.name === form.name &&
        +p.price === +form.price &&
        p.importDate === importDate
      );
      if (existed) {
        // Cộng dồn tồn kho
        setProducts(products.map(p =>
          p.id === existed.id
            ? { ...p, stock: (+p.stock || 0) + (+form.stock || 0) }
            : p
        ));
      } else {
        setProducts([...products, { id: Date.now(), ...form, supplier, price: +form.price, cost: +form.cost || 0, stock: +form.stock || 0, category: form.category, importDate, importTime }]);
      }
    }
    setForm({ name: '', barcode: '', price: '', cost: '', stock: '', category: '', importDate: getTodayDate(), supplier: '', paidAmount: '' });
    setEditingId(null);
  };

  const handleEdit = p => {
    setForm({ name: p.name, barcode: p.barcode, price: p.price, cost: p.cost, stock: p.stock, category: p.category || '', importDate: p.importDate || '', supplier: p.supplier || '', paidAmount: '' });
    setEditingId(p.id);
  };

  // Tìm kiếm sản phẩm
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const filteredProducts = products
    .filter(p => {
      const matchText =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase());
      if (!matchText) return false;
      if (dateFrom) {
        if (!p.importDate || p.importDate < dateFrom) return false;
      }
      if (dateTo) {
        if (!p.importDate || p.importDate > dateTo) return false;
      }
      if (stockFilter === 'low' && !(p.stock > 0 && p.stock <= 3)) return false;
      if (stockFilter === 'out' && p.stock !== 0) return false;
      if (stockFilter === 'in' && !(p.stock > 3)) return false;
      return true;
    })
    .sort((a, b) => {
      // Sắp xếp giảm dần theo ngày nhập
      if (!a.importDate && !b.importDate) return 0;
      if (!a.importDate) return 1;
      if (!b.importDate) return -1;
      return b.importDate.localeCompare(a.importDate);
    });

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 16 }}>
      <h2>Quản lý Hàng hóa</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Tên sản phẩm" required />
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', marginBottom: 8 }}>
          <input 
            name="barcode" 
            value={form.barcode} 
            onChange={handleChange} 
            placeholder="Mã vạch" 
            required 
            style={{ flex: 1, marginBottom: 0 }} 
          />
          <button 
            type="button" 
            onClick={handleScanBarcode}
            style={{ 
              whiteSpace: 'nowrap',
              padding: '13px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '15px',
              marginTop: 0,
              marginBottom: 0,
              height: 'auto'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Quét</span>
          </button>
        </div>
        <div id="qr-reader" style={{ width: 250, margin: '8px auto', display: 'none' }}></div>
        <input name="price" value={form.price} onChange={handleChange} placeholder="Giá bán" type="number" required />
        <input name="cost" value={form.cost} onChange={handleChange} placeholder="Giá vốn (tùy chọn)" type="number" />
        <input name="stock" value={form.stock} onChange={handleChange} placeholder="Tồn kho" type="number" />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Nhóm hàng (ví dụ: Đồ uống)" />
        <div style={{display:'flex',flexDirection:'column',gap:2}}>
          <label htmlFor="importDate" style={{fontWeight:500,marginBottom:2}}>Ngày nhập hàng <span style={{color:'#888',fontSize:'0.95em'}}>(dd/mm/yyyy)</span></label>
          <input name="importDate" id="importDate" value={form.importDate} onChange={e => {
            let v = e.target.value;
            // Nếu nhập dạng ddmmyy hoặc ddmm, tự động chuyển sang dd/mm/yyyy
            if (/^\d{6}$/.test(v)) {
              // ddmmyy => dd/mm/yyyy
              const year = parseInt(v.slice(4,6),10);
              const fullYear = year < 50 ? 2000+year : 1900+year;
              v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + fullYear;
            } else if (/^\d{4}$/.test(v)) {
              v = v.replace(/(\d{2})(\d{2})/, '$1/$2/');
            } else if (/^\d{8}$/.test(v)) {
              v = v.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
            }
            setForm(f => ({ ...f, importDate: v }));
          }}
          onBlur={e => {
            let v = e.target.value;
            if (/^\d{6}$/.test(v)) {
              const year = parseInt(v.slice(4,6),10);
              const fullYear = year < 50 ? 2000+year : 1900+year;
              v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + fullYear;
            } else if (/^\d{4}$/.test(v)) {
              v = v.replace(/(\d{2})(\d{2})/, '$1/$2/');
            } else if (/^\d{8}$/.test(v)) {
              v = v.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
            }
            setForm(f => ({ ...f, importDate: v }));
          }}
          placeholder="dd/mm/yyyy" type="text" style={{paddingLeft:10}} />
        </div>
        <input name="supplier" value={form.supplier} onChange={handleChange} placeholder="Người cung cấp (mặc định: Vãng lai)" />
        <input name="paidAmount" value={form.paidAmount} onChange={handleChange} placeholder="Đã thanh toán (tùy chọn)" type="number" />
        {form.cost && form.stock && (
          <div style={{background: '#f0f9ff', padding: '8px 12px', borderRadius: 8, fontSize: '0.95em', color: '#0369a1', border: '1px solid #bae6fd'}}>
            <div>Tổng giá trị: <strong>{((+form.cost || 0) * (+form.stock || 0)).toLocaleString()}đ</strong></div>
            {form.paidAmount && (
              <div>Còn nợ: <strong>{((+form.cost || 0) * (+form.stock || 0) - (+form.paidAmount || 0)).toLocaleString()}đ</strong></div>
            )}
          </div>
        )}
        <button type="submit">{editingId ? 'Cập nhật' : 'Thêm sản phẩm'}</button>
      </form>
      <div style={{ margin: '18px 0 10px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo tên, mã vạch, nhóm..."
          style={{ width: '100%', fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={{ flex: 1, fontSize: 15, padding: 6, borderRadius: 8, border: '1px solid #ddd' }}
            placeholder="Từ ngày nhập"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            style={{ flex: 1, fontSize: 15, padding: 6, borderRadius: 8, border: '1px solid #ddd' }}
            placeholder="Đến ngày nhập"
          />
        </div>
        <select
          value={stockFilter}
          onChange={e => setStockFilter(e.target.value)}
          style={{ width: '100%', fontSize: 15, padding: 6, borderRadius: 8, border: '1px solid #ddd' }}
        >
          <option value="all">Tất cả tồn kho</option>
          <option value="low">Sắp hết hàng (≤ 3)</option>
          <option value="out">Hết hàng (= 0)</option>
          <option value="in">Còn hàng (&gt; 3)</option>
        </select>
        <button
          type="button"
          style={{ marginTop: 4, alignSelf: 'flex-end', background: '#eee', borderRadius: 8, padding: '6px 16px', fontSize: 15, border: 'none', color: '#333' }}
          onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setStockFilter('all'); }}
        >Xoá bộ lọc</button>
      </div>
      <div style={{ marginTop: 16 }}>
        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', color: '#888' }}>Không tìm thấy sản phẩm nào.</div>
        )}
        {filteredProducts.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px #eee', marginBottom: 12, padding: 12, fontSize: 15 }}>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>{p.name}</div>
            <div style={{ color: '#555', fontSize: 13 }}>Barcode: <span style={{ fontWeight: 500 }}>{p.barcode}</span></div>
            <div style={{ color: '#555', fontSize: 13 }}>Nhóm: <span style={{ fontWeight: 500 }}>{p.category || '-'}</span></div>
            <div style={{ color: '#555', fontSize: 13 }}>Giá bán: <span style={{ fontWeight: 500 }}>{p.price.toLocaleString()} VND</span></div>
            <div style={{ color: '#555', fontSize: 13 }}>Giá vốn: <span style={{ fontWeight: 500 }}>{p.cost ? p.cost.toLocaleString() : '-'}</span></div>
            <div style={{ color: '#555', fontSize: 13 }}>Tồn kho: <span style={{ fontWeight: 500 }}>{p.stock}</span>
              {p.stock === 0 && (
                <span style={{ color: 'red', fontWeight: 'bold', marginLeft: 8 }}>Hết hàng!</span>
              )}
              {p.stock > 0 && p.stock <= 3 && (
                <span style={{ color: 'orange', fontWeight: 'bold', marginLeft: 8 }}>Sắp hết hàng!</span>
              )}
            </div>
            <div style={{ color: '#555', fontSize: 13 }}>
              Ngày nhập: <span style={{ fontWeight: 500 }}>{p.importDate || '-'}</span>
              {p.importTime && <span style={{ marginLeft: 8, color: '#888' }}>({p.importTime})</span>}
            </div>
            <div style={{ color: '#555', fontSize: 13 }}>Người cung cấp: <span style={{ fontWeight: 500 }}>{p.supplier || 'Vãng lai'}</span></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button style={{ flex: 1, padding: '6px 0', fontSize: 15 }} onClick={() => handleEdit(p)}>Sửa</button>
              <button
                style={{ flex: 1, padding: '6px 0', fontSize: 15, background: '#ffe5e5' }}
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn xoá sản phẩm này?')) {
                    // Lưu vào thùng rác
                    const deleted = JSON.parse(localStorage.getItem('deletedProducts') || '[]');
                    localStorage.setItem('deletedProducts', JSON.stringify([...deleted, p]));
                    setProducts(products.filter(x => x.id !== p.id));
                  }
                }}
              >Xóa</button>
            </div>
          </div>
        ))}
      </div>
      <button
        style={{ 
          position: 'fixed', 
          right: 20, 
          bottom: 20, 
          zIndex: 998,
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '50%',
          border: 'none',
          boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-4px) scale(1.05)';
          e.target.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0) scale(1)';
          e.target.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
        }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Lên đầu trang"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      </button>
    </div>
  );
}
export default Catalog;
