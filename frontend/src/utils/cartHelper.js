import BASE_URL from "../config/api";
import toast from "react-hot-toast";

// Helper lấy Token xác thực từ bộ nhớ trình duyệt
export const getToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

// Phát sự kiện toàn cục để thông báo cho các component lắng nghe
export const dispatchCartUpdate = () => {
  window.dispatchEvent(new Event("cartUpdated"));
};

// 1. Tải giỏ hàng từ cơ sở dữ liệu đè lên localStorage
export const fetchCartFromDb = async () => {
  const token = getToken();
  if (!token) return [];

  try {
    const res = await fetch(`${BASE_URL}/api/cart`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const dbCart = await res.json();
      localStorage.setItem("cart", JSON.stringify(dbCart));
      dispatchCartUpdate();
      return dbCart;
    }
  } catch (error) {
    console.error("Lỗi tải giỏ hàng từ DB:", error);
  }
  return JSON.parse(localStorage.getItem("cart")) || [];
};

// 2. Gộp giỏ hàng tạm (localStorage) vào database khi đăng nhập thành công
export const syncLocalCartWithDb = async () => {
  const token = getToken();
  if (!token) return;

  const localCart = JSON.parse(localStorage.getItem("cart")) || [];
  if (localCart.length === 0) {
    // Nếu giỏ hàng local trống, chỉ cần tải giỏ hàng từ DB về
    await fetchCartFromDb();
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/cart/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: localCart }),
    });

    if (res.ok) {
      const mergedCart = await res.json();
      localStorage.setItem("cart", JSON.stringify(mergedCart));
      dispatchCartUpdate();
    } else {
      console.warn("Không thể đồng bộ giỏ hàng DB, tải giỏ hàng DB hiện tại");
      await fetchCartFromDb();
    }
  } catch (error) {
    console.error("Lỗi đồng bộ gộp giỏ hàng:", error);
    await fetchCartFromDb();
  }
};

// 3. Thêm một sản phẩm vào giỏ hàng
export const addToCart = async (item, quantity = 1) => {
  // item: { id, variantId, ten_san_pham, hinh_anh, gia_ban, dung_luong, mau_sac, ram, sku }
  const localCart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingIndex = localCart.findIndex((i) => i.variantId === item.variantId);

  let newQty = quantity;
  if (existingIndex > -1) {
    newQty = localCart[existingIndex].so_luong + quantity;
    localCart[existingIndex].so_luong = newQty;
  } else {
    localCart.push({
      ...item,
      so_luong: quantity,
      selected: true,
    });
  }

  // Cập nhật localStorage ngay lập tức để UI mượt mà
  localStorage.setItem("cart", JSON.stringify(localCart));
  dispatchCartUpdate();

  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${BASE_URL}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bien_the_id: item.variantId,
          so_luong: quantity,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.message || "Không thể đồng bộ sản phẩm vào giỏ hàng DB!");
        // Revert local state bằng cách kéo dữ liệu chính xác từ DB
        await fetchCartFromDb();
      }
    } catch (error) {
      console.error("Lỗi thêm vào giỏ hàng DB:", error);
      await fetchCartFromDb();
    }
  }
};

// 4. Cập nhật số lượng của một sản phẩm
export const updateQuantity = async (variantId, quantity) => {
  let localCart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingIndex = localCart.findIndex((i) => i.variantId === variantId);

  if (existingIndex > -1) {
    if (quantity <= 0) {
      localCart.splice(existingIndex, 1);
    } else {
      localCart[existingIndex].so_luong = quantity;
    }
    localStorage.setItem("cart", JSON.stringify(localCart));
    dispatchCartUpdate();
  }

  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${BASE_URL}/api/cart`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bien_the_id: variantId,
          so_luong: quantity,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.message || "Không thể cập nhật số lượng trên máy chủ!");
        await fetchCartFromDb();
      }
    } catch (error) {
      console.error("Lỗi cập nhật số lượng DB:", error);
      await fetchCartFromDb();
    }
  }
};

// 5. Xóa một sản phẩm khỏi giỏ hàng
export const removeFromCart = async (variantId) => {
  let localCart = JSON.parse(localStorage.getItem("cart")) || [];
  localCart = localCart.filter((i) => i.variantId !== variantId);

  localStorage.setItem("cart", JSON.stringify(localCart));
  dispatchCartUpdate();

  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${BASE_URL}/api/cart/${variantId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        toast.error("Không thể xóa sản phẩm trên máy chủ!");
        await fetchCartFromDb();
      }
    } catch (error) {
      console.error("Lỗi xóa sản phẩm DB:", error);
      await fetchCartFromDb();
    }
  }
};

// 6. Xóa các sản phẩm đã chọn khỏi giỏ hàng sau khi đặt hàng thành công
export const clearSelectedItems = async (variantIds) => {
  if (!Array.isArray(variantIds) || variantIds.length === 0) return;

  let localCart = JSON.parse(localStorage.getItem("cart")) || [];
  localCart = localCart.filter((i) => !variantIds.includes(i.variantId));

  localStorage.setItem("cart", JSON.stringify(localCart));
  dispatchCartUpdate();

  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${BASE_URL}/api/cart/clear-selected`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ variantIds }),
      });

      if (!res.ok) {
        console.warn("Không thể xóa sạch giỏ hàng thanh toán trên máy chủ!");
        await fetchCartFromDb();
      }
    } catch (error) {
      console.error("Lỗi dọn dẹp giỏ hàng thanh toán DB:", error);
      await fetchCartFromDb();
    }
  }
};
