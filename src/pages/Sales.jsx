import React, { useState, useContext } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import ProductContext from '../ProductContext';
import OrderContext from '../OrderContext';

function Sales() {
        const cashInputRef = React.useRef();
        const bankInputRef = React.useRef();
      const [cashPaid, setCashPaid] = useState(0);
      const [bankPaid, setBankPaid] = useState(0);
    const [unpaid, setUnpaid] = useState(false);
  const { products, setProducts } = useContext(ProductContext);
  const { orders, setOrders } = useContext(OrderContext);
  const [query, setQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  // Quét mã vạch bằng camera
  const handleScanBarcode = async () => {
    const qrRegionId = 'qr-reader-sales';
    const html5QrCode = new Html5Qrcode(qrRegionId);
    setScanning(true);
    document.getElementById(qrRegionId).style.display = 'block';
    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          setQuery(decodedText);
          html5QrCode.stop();
          setScanning(false);
          document.getElementById(qrRegionId).style.display = 'none';
        },
        (errorMessage) => {}
      );
    } catch (err) {
      alert('Không thể mở camera hoặc quét mã vạch!');
      setScanning(false);
      document.getElementById(qrRegionId).style.display = 'none';
    }
  };
  const [cart, setCart] = useState([]);
  const [payMethod, setPayMethod] = useState('cash');
  const [buyer, setBuyer] = useState('');
  const [lastOrder, setLastOrder] = useState(null);

  // Thêm sản phẩm vào giỏ: chọn lô nhập theo FIFO (ngày nhập sớm nhất, còn tồn kho)
  const handleAdd = p => {
    // Tìm tất cả lô cùng barcode còn tồn kho
    const batches = products.filter(x => x.barcode === p.barcode && x.stock > 0);
    if (batches.length === 0) return alert('Không còn tồn kho cho sản phẩm này!');
    // Sắp xếp theo ngày nhập tăng dần (FIFO)
    batches.sort((a, b) => new Date(a.importDate) - new Date(b.importDate));
    const batch = batches[0];
    const found = cart.find(item => item.id === batch.id);
    if (found) {
      setCart(cart.map(item => item.id === batch.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...batch, qty: 1, importDate: batch.importDate }]);
    }
    setQuery('');
  };

  const handleQty = (id, delta) => {
    setCart(cart.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  };

  const handlePay = () => {
    if (cart.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }
    
    const buyerName = buyer.trim() === '' ? 'Vãng lai' : buyer.trim();
    const debt = Math.max(0, total - cashPaid - bankPaid);
    
    // Kiểm tra: Khách vãng lai không được thiếu
    if (buyerName === 'Vãng lai' && debt > 0) {
      alert('Khách vãng lai không được mua thiếu! Vui lòng thanh toán đủ hoặc nhập tên người mua.');
      return;
    }
    
    // Trừ tồn kho theo từng lô
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, (p.stock || 0) - cartItem.qty) };
      }
      return p;
    });
    setProducts(updatedProducts);
    // Sinh mã đơn hàng: yyyyMMdd-xxx
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const todayOrders = orders.filter(o => o.createdAt && o.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10));
    const orderSeq = (todayOrders.length + 1).toString().padStart(3, '0');
    const orderId = `${todayStr}-${orderSeq}`;
    const now = new Date();
    const newOrder = {
      id: orderId,
      items: cart,
      total,
      buyer: buyerName,
      createdAt: now.toISOString(),
      createdTime: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      cashPaid,
      bankPaid,
      paid: debt === 0,
      debt,
    };
    setOrders([...orders, newOrder]);
    setLastOrder(newOrder);
    setCart([]);
    setBuyer('');
    setCashPaid(0);
    setBankPaid(0);
  };

  // Hiển thị từng lô nhập khi tìm kiếm
  const filtered = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.barcode.includes(query));

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Low stock warning
  const lowStock = products ? products.filter(p => p.stock <= 3) : [];

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 16 }}>
      <h2>Bán hàng / Tính tiền</h2>
      {lowStock.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: 'red' }}>Cảnh báo sắp hết hàng:</strong>
          <ul>
            {lowStock.map(p => (
              <li key={p.id}>{p.name} (còn {p.stock})</li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', marginBottom: 8 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tìm kiếm hoặc quét mã vạch"
          style={{ flex: 1, fontSize: 16, marginBottom: 0 }}
        />
        <button 
          type="button" 
          onClick={handleScanBarcode} 
          disabled={scanning}
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
      <div style={{ marginBottom: 8 }}>
        <input
          value={buyer}
          onChange={e => setBuyer(e.target.value)}
          placeholder="Tên người mua (mặc định: Vãng lai)"
          style={{ width: '100%', fontSize: 16, marginTop: 4 }}
        />
      </div>
      <div id="qr-reader-sales" style={{ width: 250, margin: '8px auto', display: 'none' }}></div>
      {query && (
        <div style={{ background: '#fff', borderRadius: 8, marginBottom: 8 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
              {p.name} - {p.price.toLocaleString()} 
              {typeof p.stock === 'number' && p.stock <= 3 && (
                <span style={{ color: 'red', fontWeight: 'bold', marginLeft: 8 }}>
                  Sắp hết hàng!
                </span>
              )}
              <button onClick={() => handleAdd(p)}>Thêm</button>
            </div>
          ))}
        </div>
      )}
      <h3>Giỏ hàng</h3>
      <table style={{ width: '100%', background: '#fff', borderRadius: 8 }}>
        <tbody>
          {cart.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.price.toLocaleString()}</td>
              <td>
                <button onClick={() => handleQty(item.id, -1)}>-</button>
                {item.qty}
                <button onClick={() => handleQty(item.id, 1)}>+</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 16 }}>
        <strong>Tổng tiền: {total.toLocaleString()} VND</strong>
      </div>
      {/* Đã bỏ 3 ô chọn phương thức thanh toán, chỉ còn các ô nhập số tiền */}
      <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 15 }}>
          Tiền mặt đã trả:
          <input
            ref={cashInputRef}
            type="text"
            inputMode="numeric"
            min="0"
            value={cashPaid.toLocaleString()}
            onChange={e => {
              const val = e.target.value.replace(/[^\d]/g, '');
              setCashPaid(Number(val));
            }}
            onFocus={e => e.target.select()}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                bankInputRef.current && bankInputRef.current.focus();
              }
            }}
            style={{ width: '100%', fontSize: 16, marginTop: 4 }}
          />
        </label>
        <label style={{ fontSize: 15 }}>
          Chuyển khoản đã trả:
          <input
            ref={bankInputRef}
            type="text"
            inputMode="numeric"
            min="0"
            value={bankPaid.toLocaleString()}
            onChange={e => {
              const val = e.target.value.replace(/[^\d]/g, '');
              setBankPaid(Number(val));
            }}
            onFocus={e => e.target.select()}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                // Focus vào nút Thanh Toán
                const payBtn = document.getElementById('pay-btn');
                if (payBtn) payBtn.focus();
              }
            }}
            style={{ width: '100%', fontSize: 16, marginTop: 4 }}
          />
        </label>
        <label style={{ fontSize: 15 }}>
          Tiền chưa thanh toán:
          <input
            type="text"
            value={Math.max(0, total - cashPaid - bankPaid).toLocaleString()}
            readOnly
            style={{ width: '100%', fontSize: 16, marginTop: 4, background: '#eee', color: '#888' }}
            onFocus={e => e.target.select()}
          />
        </label>
      </div>
      <button id="pay-btn" style={{ width: '100%', fontSize: 18, marginTop: 8 }} onClick={handlePay}>Thanh Toán</button>
      {lastOrder && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Đã ghi nhận đơn hàng</h3>
          <div>Mã đơn: {lastOrder.id}</div>
          <div>Thời gian: {lastOrder.createdTime || new Date(lastOrder.createdAt).toLocaleTimeString('vi-VN')}</div>
          <div>Người mua: {lastOrder.buyer}</div>
          <div>Tổng tiền: {lastOrder.total.toLocaleString()} VND</div>
          <div>Tiền mặt đã trả: {Number(lastOrder.cashPaid || 0).toLocaleString()} VND</div>
          <div>Chuyển khoản đã trả: {Number(lastOrder.bankPaid || 0).toLocaleString()} VND</div>
          <div style={{ color: lastOrder.debt > 0 ? 'red' : 'green' }}>
            Tiền chưa thanh toán: {Number(lastOrder.debt || 0).toLocaleString()} VND
          </div>
          <ul>
            {lastOrder.items.map(item => (
              <li key={item.id}>
                {item.name} x {item.qty} = {(item.price * item.qty).toLocaleString()} VND
                {item.importDate && (
                  <span style={{ color: '#888', marginLeft: 8 }}>
                    (Nhập: {item.importDate})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
export default Sales;
