import React, { useContext, useEffect, useState } from 'react';
import { ProductProvider } from './ProductContext';
import ProductContext from './ProductContext';
import LowStockToast from './LowStockToast';
import { OrderProvider } from './OrderContext';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Catalog from './pages/Catalog';
import Sales from './pages/Sales';
import Report from './pages/Report';
import DebtReport from './pages/DebtReport';
import SupplierDebt from './pages/SupplierDebt';
import RecycleBin from './pages/RecycleBin';
import Login from './pages/Login';
import Standalone from './pages/Standalone';

const LOCAL_KEY = 'app_auth';
const PASS_KEY = 'app_password';

function App() {
  const { products } = useContext(ProductContext) || {};
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [isAuth, setIsAuth] = useState(localStorage.getItem(LOCAL_KEY) === 'ok');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetPass, setResetPass] = useState('');
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [errorReset, setErrorReset] = useState('');
  const [menuOpen, setMenuOpen] = useState(false); // Hamburger menu state

  const isBiometricSupported = window.PublicKeyCredential !== undefined;
  const savedPass = localStorage.getItem(PASS_KEY) || '123456';

  useEffect(() => {
    if (products) {
      const lows = products.filter(p => p.stock <= 3);
      setLowStockProducts(lows);
    }
  }, [products]);

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_KEY);
    setIsAuth(false);
  };

  const handleResetData = () => {
    setShowResetDialog(true);
    setResetPass('');
    setBiometricVerified(false);
    setErrorReset('');
  };

  const handleBiometricVerify = async () => {
    if (!isBiometricSupported) {
      setErrorReset('Thiết bị không hỗ trợ sinh học!');
      return;
    }
    try {
      const cred = await navigator.credentials.get({ publicKey: {
        challenge: new Uint8Array([9,8,7,6]),
        timeout: 60000,
        userVerification: 'preferred',
      }});
      if (cred) {
        setBiometricVerified(true);
        setErrorReset('');
      } else {
        setErrorReset('Không nhận diện được!');
      }
    } catch (e) {
      setErrorReset('Thiết bị không hỗ trợ hoặc chưa đăng ký sinh học!');
    }
  };

  const confirmResetData = () => {
    if (!biometricVerified && resetPass !== savedPass) {
      setErrorReset('Vui lòng nhập đúng mật khẩu hoặc xác nhận sinh học!');
      return;
    }
    localStorage.clear();
    setShowResetDialog(false);
    setIsAuth(false);
    window.location.reload();
  };

  if (!isAuth) {
    return <Login onLogin={() => setIsAuth(true)} />;
  }

  return (
    <ProductProvider>
      <OrderProvider>
        <BrowserRouter>
          <div>
            <style>{`
              /* Custom Navigation Bar */
              .custom-navbar {
                background: rgba(255, 255, 255, 0.75);
                backdrop-filter: blur(20px) saturate(180%);
                box-shadow: 0 4px 24px rgba(102, 126, 234, 0.15);
                border-radius: 20px;
                margin: 24px auto;
                max-width: 1200px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 12px 16px;
              }
              
              .custom-navbar-inner {
                display: flex;
                width: 100%;
                max-width: 1100px;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
              }
              
              .custom-navbar-links {
                display: flex;
                flex: 1;
                gap: 8px;
              }
              
              .custom-navbar-links .navbar-item {
                flex: 1;
                text-align: center;
                color: #1a202c !important;
                font-weight: 600;
                font-size: 15px;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                padding: 12px 8px;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.5);
                border: 1px solid rgba(102, 126, 234, 0.15);
                text-decoration: none;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
              }
              
              .custom-navbar-links .navbar-item:hover {
                background: rgba(255, 255, 255, 0.9);
                border-color: #667eea;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
              }
              
              .custom-navbar .button {
                color: white !important;
                font-weight: 600;
                font-size: 14px;
                transition: all 0.25s ease;
                border-radius: 10px;
                padding: 10px 16px;
                border: none;
                cursor: pointer;
                white-space: nowrap;
              }
              
              .custom-navbar .button.is-danger {
                background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
              }
              
              .custom-navbar .button.is-warning {
                background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
              }
              
              .custom-navbar .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
              }
              
              /* Glass Card for dialogs */
              .glass-card {
                background: rgba(255, 255, 255, 0.85);
                border-radius: 24px;
                box-shadow: 0 12px 48px rgba(102, 126, 234, 0.2);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 32px 24px;
                margin: 32px auto;
                max-width: 500px;
              }
              
              /* Dialog styling */
              .reset-dialog-bg {
                position: fixed;
                left: 0;
                top: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .reset-dialog {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                box-shadow: 0 12px 48px rgba(102, 126, 234, 0.25);
                padding: 32px 28px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.3);
                animation: fadeIn 0.3s ease-out;
              }
              
              /* Page content wrapper */
              .page-content-wrapper {
                padding: 20px;
                max-width: 1400px;
                margin: 0 auto;
              }
              
              /* Responsive Design */
              @media (max-width: 768px) {
                .custom-navbar {
                  display: none !important;
                }
                
                .glass-card {
                  padding: 24px 16px;
                  margin: 16px;
                }
                
                .reset-dialog {
                  padding: 24px 20px;
                }
                
                /* Add spacing for content below hamburger on mobile */
                .page-content-wrapper {
                  padding: 80px 12px 20px 12px;
                }
              }
            `}</style>
            {/* Hamburger button - Chỉ hiện trên mobile */}
            <button
              className="hamburger-btn"
              aria-label="Mở menu"
              onClick={() => setMenuOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            
            {/* Menu overlay - Full screen mobile menu */}
            {menuOpen && (
              <div className="hamburger-menu-overlay">
                {/* Header với nút đóng */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 24px 24px 24px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <h2 style={{
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    margin: 0
                  }}>Menu</h2>
                  <button
                    onClick={() => setMenuOpen(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      borderRadius: '12px',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                    aria-label="Đóng menu"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                
                {/* Navigation Links */}
                <div style={{ padding: '24px 24px 16px 24px' }}>
                  <Link className="navbar-item" to="/hanghoa" onClick={()=>setMenuOpen(false)}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                    <span>Hàng hóa</span>
                  </Link>
                  <Link className="navbar-item" to="/banhang" onClick={()=>setMenuOpen(false)}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1"/>
                      <circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    <span>Bán hàng</span>
                  </Link>
                  <Link className="navbar-item" to="/baocao" onClick={()=>setMenuOpen(false)}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M21 21H4.6c-.56 0-.6-.44-.6-1V3m17 4l-5.8 6-4.2-4-5 6"/>
                    </svg>
                    <span>Báo cáo</span>
                  </Link>
                  <Link className="navbar-item" to="/congno" onClick={()=>setMenuOpen(false)}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"/>
                      <circle cx="12" cy="13" r="3"/>
                    </svg>
                    <span>Công nợ khách hàng</span>
                  </Link>
                  <Link className="navbar-item" to="/congnophaitra" onClick={()=>setMenuOpen(false)}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12h18m-9-9v18"/>
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                    <span>Công nợ nhà cung cấp</span>
                  </Link>
                  <Link className="navbar-item" to="/recycle" onClick={()=>setMenuOpen(false)}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                    <span>Khôi phục dữ liệu</span>
                  </Link>
                  <Link className="navbar-item" to="/" onClick={()=>setMenuOpen(false)}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
                    </svg>
                    <span>Giới thiệu</span>
                  </Link>
                </div>
                
                {/* Action Buttons */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', marginTop: 'auto' }}>
                  <button 
                    className="button is-danger" 
                    style={{
                      width: '100%',
                      marginBottom: '12px',
                      background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5m0 0l-5-5m5 5H9"/>
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                  <button 
                    className="button is-warning"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => { handleResetData(); setMenuOpen(false); }}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                      <path d="M21 3v5h-5"/>
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                      <path d="M3 21v-5h5"/>
                    </svg>
                    <span>Đặt lại dữ liệu</span>
                  </button>
                </div>
              </div>
            )}
            {/* Nav bar và các nút chức năng vẫn giữ nguyên cho desktop */}
            <nav className="custom-navbar" role="navigation" aria-label="main navigation">
              <div className="custom-navbar-inner">
                <div className="custom-navbar-links" style={{flex:2}}>
                  <Link className="navbar-item" to="/hanghoa" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',padding:'0.75rem 0.5rem'}}>
                    <span style={{display:'flex',alignItems:'center'}}>
                      <svg width="16" height="16" style={{verticalAlign:'middle'}} fill="none" viewBox="0 0 24 24"><path d="M4 7V4h16v3" stroke="#fff" strokeWidth="2"/><rect x="4" y="7" width="16" height="13" rx="2" stroke="#fff" strokeWidth="2"/></svg>
                    </span>
                    <span style={{display:'flex',alignItems:'center'}}>Hàng hóa</span>
                  </Link>
                  <Link className="navbar-item" to="/banhang" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',padding:'0.75rem 0.5rem'}}>
                    <span style={{display:'flex',alignItems:'center'}}>
                      <svg width="16" height="16" style={{verticalAlign:'middle'}} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/><path d="M8 12h8" stroke="#fff" strokeWidth="2"/></svg>
                    </span>
                    <span style={{display:'flex',alignItems:'center'}}>Bán hàng</span>
                  </Link>
                  <Link className="navbar-item" to="/baocao" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',padding:'0.75rem 0.5rem'}}>
                    <span style={{display:'flex',alignItems:'center'}}>
                      <svg width="16" height="16" style={{verticalAlign:'middle'}} fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" stroke="#fff" strokeWidth="2"/><path d="M8 16v-4m4 4v-7m4 7v-2" stroke="#fff" strokeWidth="2"/></svg>
                    </span>
                    <span style={{display:'flex',alignItems:'center'}}>Báo cáo</span>
                  </Link>
                  <Link className="navbar-item" to="/congno" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',padding:'0.75rem 0.5rem'}}>
                    <span style={{display:'flex',alignItems:'center'}}>
                      <svg width="16" height="16" style={{verticalAlign:'middle'}} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2">
                        <path d="M19 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"/>
                        <circle cx="12" cy="13" r="3"/>
                      </svg>
                    </span>
                    <span style={{display:'flex',alignItems:'center'}}>Nợ KH</span>
                  </Link>
                  <Link className="navbar-item" to="/congnophaitra" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',padding:'0.75rem 0.5rem'}}>
                    <span style={{display:'flex',alignItems:'center'}}>
                      <svg width="16" height="16" style={{verticalAlign:'middle'}} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2">
                        <path d="M3 12h18m-9-9v18"/>
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    </span>
                    <span style={{display:'flex',alignItems:'center'}}>Nợ NCC</span>
                  </Link>
                  <Link className="navbar-item" to="/recycle" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',padding:'0.75rem 0.5rem'}}>
                    <span style={{display:'flex',alignItems:'center'}}>
                      <svg width="16" height="16" style={{verticalAlign:'middle'}} fill="none" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="3" stroke="#fff" strokeWidth="2"/><path d="M9 9l6 6m0-6l-6 6" stroke="#fff" strokeWidth="2"/></svg>
                    </span>
                    <span style={{display:'flex',alignItems:'center'}}>Khôi phục dữ liệu</span>
                  </Link>
                  <Link className="navbar-item" to="/" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',padding:'0.75rem 0.5rem'}}>
                    <span style={{display:'flex',alignItems:'center'}}>
                      <svg width="18" height="18" style={{verticalAlign:'middle'}} fill="none" viewBox="0 0 24 24"><path d="M3 10v4a1 1 0 0 0 1 1h3l7 5V4l-7 5H4a1 1 0 0 0-1 1z" stroke="#fff" strokeWidth="2"/><path d="M16 17a3 3 0 0 0 6 0" stroke="#fff" strokeWidth="2"/></svg>
                    </span>
                    <span style={{display:'flex',alignItems:'center'}}>Giới thiệu</span>
                  </Link>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'8px',alignItems:'center',minWidth:'90px',justifyContent:'center'}}>
                  <button className="button is-danger is-light" style={{width:'100%',padding:'0.35rem 0.5rem',fontSize:'0.92rem',borderRadius:'6px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px'}} onClick={handleLogout}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="#d7263d" strokeWidth="2"/><path d="M10 17l-5-5m0 0l5-5m-5 5h12" stroke="#d7263d" strokeWidth="2"/></svg>
                    Đăng xuất
                  </button>
                  <button className="button is-warning is-light" style={{width:'100%',padding:'0.35rem 0.5rem',fontSize:'0.92rem',borderRadius:'6px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px'}} onClick={handleResetData}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M4 4v16h16V4H4zm2 2h12v12H6V6zm6 2v8m-4-4h8" stroke="#e6a700" strokeWidth="2"/></svg>
                    Đặt lại dữ liệu
                  </button>
                </div>
              </div>
            </nav>
            <div className="page-content-wrapper">
              <Routes>
                <Route path="/" element={<Standalone />} />
                <Route path="/hanghoa" element={<Catalog />} />
                <Route path="/banhang" element={<Sales />} />
                <Route path="/baocao" element={<Report />} />
                <Route path="/congno" element={<DebtReport />} />
                <Route path="/congnophaitra" element={<SupplierDebt />} />
                <Route path="/recycle" element={<RecycleBin />} />
              </Routes>
            </div>
            <LowStockToast lowStockProducts={lowStockProducts} />
            {showResetDialog && (
              <div className="reset-dialog-bg">
                <div className="reset-dialog">
                  <h3 style={{fontWeight:700,fontSize:'1.2rem',marginBottom:12}}>Xác nhận đặt lại dữ liệu</h3>
                  <div style={{marginBottom:18}}>Tất cả dữ liệu, mật khẩu và cấu hình bảo mật sẽ bị xóa khỏi thiết bị này.<br/>Bạn có chắc chắn muốn tiếp tục?</div>
                  <div style={{marginBottom:12}}>
                    <input className="input" style={{borderRadius:8,marginBottom:8}} type="password" value={resetPass} onChange={e=>setResetPass(e.target.value)} placeholder="Nhập mật khẩu để xác nhận..." disabled={biometricVerified} />
                    <button className="button is-link is-fullwidth" style={{marginBottom:8}} type="button" onClick={handleBiometricVerify} disabled={biometricVerified || !isBiometricSupported}>Xác nhận bằng sinh học</button>
                    {biometricVerified && <span className="tag is-success ml-2">Đã xác thực sinh học</span>}
                  </div>
                  <button className="button is-danger is-fullwidth" style={{marginBottom:8,background:'#d7263d',color:'#fff',border:'none'}} onClick={confirmResetData}>Đồng ý đặt lại</button>
                  <button className="button is-light is-fullwidth" onClick={() => setShowResetDialog(false)}>Hủy</button>
                  {errorReset && <div className="notification is-danger mt-3" style={{borderRadius:8,textAlign:'center'}}>{errorReset}</div>}
                </div>
              </div>
            )}
          </div>
        </BrowserRouter>
      </OrderProvider>
    </ProductProvider>
  );
}

export default App;
