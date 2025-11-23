import React, { useContext, useEffect, useState } from 'react';
import { ProductProvider } from './ProductContext';
import ProductContext from './ProductContext';
import LowStockToast from './LowStockToast';
import { OrderProvider } from './OrderContext';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Catalog from './pages/Catalog';
import Sales from './pages/Sales';
import Report from './pages/Report';
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
              body {
                background: linear-gradient(120deg,#4f8cff 0%,#38c6ff 100%);
              }
              .custom-navbar {
                background: rgba(60,130,255,0.45);
                box-shadow: 0 4px 24px rgba(60,130,255,0.18);
                backdrop-filter: blur(12px);
                border-radius: 18px;
                margin: 18px auto 24px auto;
                max-width: 1200px;
                border: 1.5px solid rgba(255,255,255,0.18);
              }
              .custom-navbar-inner {
                display: flex;
                width: 100%;
                max-width: 1100px;
                align-items: center;
                justify-content: space-between;
                padding: 0 12px;
              }
              .custom-navbar-links {
                display: flex;
                flex: 1;
                gap: 0.5rem;
              }
              .custom-navbar-links .navbar-item {
                flex: 1;
                text-align: center;
                color: #fff !important;
                font-weight: 500;
                transition: background 0.2s, color 0.2s, box-shadow 0.2s;
                padding: 0.75rem 0.5rem;
                border-radius: 12px;
                background: rgba(255,255,255,0.08);
                box-shadow: 0 2px 8px rgba(60,130,255,0.08);
                border: 1px solid rgba(255,255,255,0.10);
                backdrop-filter: blur(4px);
              }
              .custom-navbar-links .navbar-item:hover {
                background: rgba(255,255,255,0.22);
                color: #ffe066 !important;
                box-shadow: 0 4px 16px rgba(60,130,255,0.18);
              }
              .custom-navbar .button {
                color: #fff !important;
                font-weight: 500;
                transition: background 0.2s, color 0.2s;
                border-radius: 12px;
                background: rgba(255,255,255,0.10);
                box-shadow: 0 2px 8px rgba(60,130,255,0.10);
                border: 1px solid rgba(255,255,255,0.10);
                backdrop-filter: blur(4px);
              }
              .custom-navbar .button:hover {
                background: rgba(255,255,255,0.22);
                color: #ffe066 !important;
                box-shadow: 0 4px 16px rgba(60,130,255,0.18);
              }
              .glass-card {
                background: rgba(255,255,255,0.55);
                border-radius: 24px;
                box-shadow: 0 8px 32px rgba(60,130,255,0.18);
                backdrop-filter: blur(18px);
                border: 1.5px solid rgba(255,255,255,0.18);
                padding: 32px 24px;
                margin: 32px auto;
                max-width: 500px;
              }
              @media (max-width: 800px) {
                .custom-navbar-inner { max-width: 100vw; }
                .custom-navbar-links .navbar-item { font-size: 0.95rem; padding: 0.6rem 0.2rem; }
                .glass-card { padding: 18px 8px; }
              }
              @media (max-width: 500px) {
                .custom-navbar-inner { flex-direction: column; align-items: stretch; }
                .custom-navbar-links { flex-direction: column; gap: 0.2rem; }
                .custom-navbar-links .navbar-item { text-align: left; }
                .glass-card { padding: 10px 2px; }
              }
              .reset-dialog-bg {
                position: fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.25); z-index:2000; display:flex; align-items:center; justify-content:center;
              }
              .reset-dialog {
                background: rgba(255,255,255,0.85); border-radius:18px; box-shadow:0 8px 32px rgba(60,130,255,0.18); padding:32px 24px; max-width:340px; width:100%; text-align:center; backdrop-filter: blur(12px); border: 1.5px solid rgba(255,255,255,0.18);
              }
            `}</style>
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
            <Routes>
              <Route path="/" element={<Standalone />} />
              <Route path="/hanghoa" element={<Catalog />} />
              <Route path="/banhang" element={<Sales />} />
              <Route path="/baocao" element={<Report />} />
              <Route path="/recycle" element={<RecycleBin />} />
            </Routes>
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
