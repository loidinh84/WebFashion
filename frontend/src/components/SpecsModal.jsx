import React from "react";

const SpecsModal = ({ isOpen, onClose, specs }) => {
  if (!isOpen) return null;

  return (
    // Lớp overlay làm mờ nền
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 p-4">
      {/* Khối Modal chính */}
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in-up overflow-hidden">
        {/* Header Modal */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg text-gray-800">Thông số kỹ thuật</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-2xl leading-none transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Tab giả lập */}
        <div className="flex overflow-x-auto border-b border-gray-100 px-4 pt-2">
          <button className="px-4 py-2 border-b-2 border-red-600 text-red-600 font-bold text-sm whitespace-nowrap">
            Tổng quan
          </button>
        </div>

        {/* Nội dung thông số */}
        <div className="p-6 overflow-y-auto">
          {specs && specs.length > 0 ? (
            <div className="flex flex-col border border-gray-200 rounded-lg">
              {specs.map((spec, idx) => (
                <div
                  key={idx}
                  className={`flex py-3 px-4 text-sm ${idx % 2 === 0 ? "border-b border-gray-100 bg-gray-50" : "border-b border-gray-100 bg-white"}`}
                >
                  <span className="w-1/3 text-blue-600 font-medium">
                    {spec.ten_thuoc_tinh}
                  </span>
                  <span className="w-2/3 text-gray-800">{spec.gia_tri}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">
              Sản phẩm này chưa được cập nhật thông số kỹ thuật.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecsModal;
