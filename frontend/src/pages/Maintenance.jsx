import React from "react";
import header from "../components/Header";

const Maintenance = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center p-6">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md">
        <div className="text-red-500 text-6xl mb-4">
          <i className="fa-solid fa-screwdriver-wrench"></i>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Đang bảo trì</h1>
        <p className="text-gray-600">
          Hệ thống đang được nâng cấp để phục vụ bạn tốt hơn. Vui lòng quay lại
          sau ít phút nhé!
        </p>
      </div>
    </div>
  );
};

export default Maintenance;
