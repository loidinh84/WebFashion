import React, { useState, useEffect } from "react";
import BASE_URL from "../config/api";
import { StoreContext } from "./StoreContext";

export const StoreProvider = ({ children }) => {
  const [storeConfig, setStoreConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreConfig = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/store-settings`);
        const result = await response.json();
        if (result.success) {
          setStoreConfig(result.data);
        }
      } catch (error) {
        console.error("Lỗi tải cấu hình cửa hàng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreConfig();
  }, []);

  return (
    <StoreContext.Provider value={{ storeConfig, loading }}>
      {children}
    </StoreContext.Provider>
  );
};
