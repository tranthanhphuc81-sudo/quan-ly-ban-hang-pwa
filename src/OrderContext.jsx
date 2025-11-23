import React, { createContext, useState } from 'react';

const OrderContext = createContext();

function getStoredOrders() {
  try {
    const data = localStorage.getItem('orders');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function OrderProvider({ children }) {
  const [orders, setOrdersRaw] = useState(getStoredOrders());
  const setOrders = (newOrders) => {
    setOrdersRaw(newOrders);
    localStorage.setItem('orders', JSON.stringify(newOrders));
  };
  return (
    <OrderContext.Provider value={{ orders, setOrders }}>
      {children}
    </OrderContext.Provider>
  );
}

export default OrderContext;
