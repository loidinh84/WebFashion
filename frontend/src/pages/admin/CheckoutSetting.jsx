import React, { useState } from "react";
import LogisticsList from "./LogisticsList";
import PaymenList from "./PaymenList";

const CheckoutSettings = () => {
  const [activeTab, setActiveTab] = useState("shipping");

  return (
    <div className="flex w-full h-full bg-[#f0f2f5] overflow-hidden justify-center relative font-sans">
      <div className="flex w-full max-w-[1600px] h-full p-4 flex-col gap-3">

        {/* Tabs */}
        <div className="flex gap-2 bg-white p-1 rounded-2xl w-fit shadow-sm border border-gray-200">
          <button
            onClick={() => setActiveTab("shipping")}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "shipping"
                ? "bg-[#2563eb] text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Đơn vị vận chuyển
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "payment"
                ? "bg-[#2563eb] text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Phương thức thanh toán
          </button>
        </div>

        {/* Nội dung */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 overflow-hidden">
          {activeTab === "shipping" ? <LogisticsList /> : <PaymenList />}
        </div>
      </div>
    </div>
  );
};

export default CheckoutSettings;
