/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState } from "react";

// Tạo Context
export const AuthContext = createContext();

// Helper an toàn để thao tác với storage (tránh lỗi bảo mật ở tab ẩn danh/sandboxed iframe)
const safeGetItem = (key) => {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  } catch (e) {
    console.warn("Không thể truy cập Storage (có thể do trình duyệt ẩn danh):", e);
    return null;
  }
};

const safeSetItem = (key, value, rememberMe) => {
  try {
    if (rememberMe) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn("Không thể lưu vào Storage:", e);
  }
};

const safeRemoveItem = (key) => {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch (e) {
    console.warn("Không thể xóa khỏi Storage:", e);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = safeGetItem("user");
      return storedUser && storedUser !== "undefined" && storedUser !== "null"
        ? JSON.parse(storedUser)
        : null;
    } catch (e) {
      console.error("Lỗi phân tích thông tin user từ storage:", e);
      return null;
    }
  });

  // Hàm xử lý khi đăng nhập thành công
  const login = (userData, token, rememberMe) => {
    setUser(userData);
    safeSetItem("token", token, rememberMe);
    safeSetItem("user", JSON.stringify(userData), rememberMe);
  };

  // Hàm xử lý đăng xuất
  const logout = () => {
    setUser(null);
    safeRemoveItem("token");
    safeRemoveItem("user");
  };

  const updateUser = (newData) => {
    setUser((prevUser) => {
      if (!prevUser) return null; // Ngăn chặn hồi sinh user nếu đã logout

      // Kiểm tra nông (shallow check) xem dữ liệu thực sự có thay đổi không
      let hasChanges = false;
      for (const key in newData) {
        if (prevUser[key] !== newData[key]) {
          hasChanges = true;
          break;
        }
      }

      // Nếu không có thay đổi, giữ nguyên tham chiếu (reference) để tránh kích hoạt useEffect loop
      if (!hasChanges) return prevUser;

      const updatedUser = { ...prevUser, ...newData };
      
      // Cập nhật lại vào storage
      try {
        if (localStorage.getItem("user")) {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } else if (sessionStorage.getItem("user")) {
          sessionStorage.setItem("user", JSON.stringify(updatedUser));
        } else {
          // Fallback lưu vào storage thích hợp
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } catch (e) {
        console.warn("Lỗi cập nhật storage trong updateUser:", e);
      }
      
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

