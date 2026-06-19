import React from "react";

const ConfirmModal = ({
  isOpen,
  title,
  message,
  detail,
  onConfirm,
  onCancel,
  confirmLabel = "Xác nhận",
  extraButton,
  type = "danger",
}) => {
  if (!isOpen) return null;

  const isDanger = type === "danger";
  const isWarning = type === "warning";
  const isInfo = type === "info";

  const headerClass = isDanger
    ? "bg-red-50 border-red-100"
    : isInfo
      ? "bg-blue-50 border-blue-100"
      : "bg-orange-50 border-orange-100";

  const titleClass = isDanger
    ? "text-red-700"
    : isInfo
      ? "text-blue-700"
      : "text-orange-700";

  const confirmClass = isDanger
    ? "bg-red-600 hover:bg-red-700"
    : isInfo
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-orange-600 hover:bg-orange-700";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-gray-900/50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${headerClass}`}>
          <h3 className={`text-lg font-bold ${titleClass}`}>{title}</h3>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <p className="text-gray-700 text-base">{message}</p>
          {detail && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
              {detail}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-white border cursor-pointer border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium text-sm"
          >
            Hủy bỏ
          </button>

          {/* Nút bổ sung (VD: Đổi trạng thái) */}
          {extraButton && (
            <button
              onClick={extraButton.onClick}
              className={
                extraButton.className ||
                "px-4 py-2 text-orange-700 bg-orange-50 border border-orange-200 cursor-pointer rounded-lg hover:bg-orange-100 transition font-medium text-sm"
              }
            >
              {extraButton.label}
            </button>
          )}

          {onConfirm && (
            <button
              onClick={onConfirm}
              className={`px-5 py-2 text-white rounded-lg font-medium cursor-pointer transition shadow-sm text-sm ${confirmClass}`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

