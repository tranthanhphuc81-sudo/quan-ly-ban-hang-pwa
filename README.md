# Quản Lý Bán Hàng PWA

Ứng dụng quản lý bán hàng đơn giản cho người bán nhỏ, xây dựng bằng React + Vite, hỗ trợ PWA.

## Chức năng chính
- Quản lý Hàng hóa (Catalog)
- Bán hàng / Tính tiền
- Báo cáo cơ bản
- Trang Standalone riêng biệt

## Cách chạy dự án
1. Cài đặt các package:
   ```
npm install
   ```
2. Chạy ứng dụng:
   ```
npm run dev
   ```
3. Truy cập trình duyệt tại `http://localhost:5173`

## PWA
- Ứng dụng có manifest và service worker, có thể cài đặt lên điện thoại như app.

## Cấu trúc thư mục
- `src/pages/`: Các trang chức năng
- `public/`: manifest, service worker, index.html

## Ghi chú
- Giao diện tối giản, dễ dùng trên điện thoại.
- Trang Standalone có thể dùng cho mục đích riêng biệt theo nhu cầu.