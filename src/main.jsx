import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Đăng ký Service Worker và kiểm tra cập nhật
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('[SW] Registered:', registration);
        
        // Kiểm tra cập nhật mỗi 30 giây
        setInterval(() => {
          registration.update();
        }, 30000);
        
        // Lắng nghe khi có SW mới
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[SW] Update found!');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Có bản cập nhật mới
              if (confirm('Có phiên bản mới! Bấm OK để tải lại trang.')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(err => {
        console.error('[SW] Registration failed:', err);
      });
  });
}
