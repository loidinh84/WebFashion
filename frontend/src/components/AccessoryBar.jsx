import React from "react";
import { Link } from "react-router-dom";
import BASE_URL from "../config/api";

const AccessoryBar = ({ title, data }) => {
  return (
    <div className="mt-4 mb-4">
      <div className="flex items-center gap-4 mb-2">
        <h2 className="text-lg md:text-xl font-medium text-gray-800 whitespace-nowrap">{title}</h2>
        <div className="flex-1 border-b border-gray-200"></div>
      </div>

      {/* Sử dụng overflow-x-auto trên mobile để có thể vuốt ngang */}
      <div className="flex overflow-x-auto pb-2 gap-3 md:gap-4 snap-x snap-mandatory hide-scrollbar">
        {data.map((item, index) => (
          <Link
            key={index}
            to={item.categoryId ? `/category/${item.categoryId}` : "#"}
            className="flex-shrink-0 flex items-center justify-start gap-3 bg-white px-4 py-3 md:py-4 rounded-lg shadow-sm hover:shadow-md hover:text-blue-600 cursor-pointer transition border border-gray-100 min-w-[140px] md:min-w-[180px] w-fit group snap-start"
          >
            <div className="h-6 md:h-7 flex items-center justify-center shrink-0">
              {item.icon && typeof item.icon === "string" ? (
                <img
                  src={
                    item.icon.startsWith("/")
                      ? `${BASE_URL}${item.icon}`
                      : `/assets/icons/${item.icon}`
                  }
                  alt={item.label || item.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                />
              ) : (
                <div className="text-xl md:text-2xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
              )}
            </div>
            <span className="font-bold text-[13px] md:text-base text-gray-700 whitespace-nowrap group-hover:text-blue-600 transition-colors">
              {item.label || item.name}
            </span>
          </Link>
        ))}
      </div>
      
      {/* Ẩn scrollbar bằng CSS nội tuyến nếu muốn */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default AccessoryBar;
