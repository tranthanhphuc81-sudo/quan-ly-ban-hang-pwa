import React, { createContext, useState } from 'react';

const ProductContext = createContext();

// Mỗi sản phẩm là một lô nhập riêng biệt
const initialProducts = [
  { id: 1, name: 'Sản phẩm A', barcode: '123456', price: 10000, cost: 8000, stock: 10, importDate: '2025-11-01', category: 'Đồ uống', batchId: 'A-20251101' },
  { id: 2, name: 'Sản phẩm A', barcode: '123456', price: 10000, cost: 8500, stock: 5, importDate: '2025-11-15', category: 'Đồ uống', batchId: 'A-20251115' },
  { id: 3, name: 'Sản phẩm B', barcode: '789012', price: 20000, cost: 15000, stock: 5, importDate: '2025-11-10', category: 'Thực phẩm', batchId: 'B-20251110' },
];

function getStoredProducts() {
  try {
    const data = localStorage.getItem('products');
    return data ? JSON.parse(data) : initialProducts;
  } catch {
    return initialProducts;
  }
}

export function ProductProvider({ children }) {
  const [products, setProductsRaw] = useState(getStoredProducts());
  const setProducts = (newProducts) => {
    setProductsRaw(newProducts);
    localStorage.setItem('products', JSON.stringify(newProducts));
  };
  return (
    <ProductContext.Provider value={{ products, setProducts }}>
      {children}
    </ProductContext.Provider>
  );
}

export default ProductContext;
