import React, { useState, useRef, useEffect, useCallback } from "react";
import * as Icons from "../../assets/icons/index";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n ?? 0));
const GAP = 16;
const START_OFFSET = 24;
const DRAG_THRESHOLD = 5;

const MembershipCarousel = ({ memberships = [], userInfo = {} }) => {
  const tongChiTieu = userInfo?.tong_chi_tieu || 0;
  const hoTen = userInfo?.ho_ten || "Khách hàng";
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const [containerW, setContainerW] = useState(0);

  const dragStartX = useRef(0);
  const dragOffset = useRef(0);
  const isDragging = useRef(false);
  const isClickCanceled = useRef(false);

  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = memberships.findIndex(
      (t) => t.id === userInfo?.the_thanh_vien_id,
    );
    return idx >= 0 ? idx : 0;
  });

  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const [cardW, setCardW] = useState(370);
  const cardWRef = useRef(370);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      const w = containerRef.current.offsetWidth;
      setContainerW(w);
      containerWRef.current = w;

      // Responsive card width: tối đa 370px, nhưng nhỏ hơn màn hình
      const newCardW = Math.min(370, w * 0.75);
      setCardW(newCardW);
      cardWRef.current = newCardW;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const containerWRef = useRef(0);

  const getBaseTranslate = useCallback(
    (index, cw, currentCardW) => {
      if (index === 0) return START_OFFSET;
      const w = cw ?? containerW;
      const cWidth = currentCardW ?? cardW;
      if (!w) return START_OFFSET;
      return w / 2 - cWidth / 2 - index * (cWidth + GAP);
    },
    [containerW, cardW],
  );

  const applyTransform = (tx, animated) => {
    if (!trackRef.current) return;
    trackRef.current.style.transition = animated
      ? "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      : "none";
    trackRef.current.style.transform = `translateX(${tx}px)`;
  };

  useEffect(() => {
    if (!isDragging.current) {
      applyTransform(getBaseTranslate(activeIndex, containerW), true);
    }
  }, [activeIndex, containerW]);

  const onDragStart = (clientX) => {
    if (isDragging.current) return;
    isDragging.current = true;
    dragStartX.current = clientX;
    dragOffset.current = 0;
    isClickCanceled.current = false;
    // Set cursor trực tiếp → không re-render
    if (containerRef.current) containerRef.current.style.cursor = "grabbing";
    if (trackRef.current) trackRef.current.style.transition = "none";

    const moveHandler = (ev) => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const delta = cx - dragStartX.current;
      dragOffset.current = delta;

      if (Math.abs(delta) > DRAG_THRESHOLD) {
        isClickCanceled.current = true;
      }

      // Trực tiếp set style, không qua React
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${
          getBaseTranslate(activeIndexRef.current, containerWRef.current) +
          delta
        }px)`;
      }
    };

    const endHandler = () => {
      isDragging.current = false;
      if (containerRef.current) containerRef.current.style.cursor = "grab";
      document.removeEventListener("mousemove", moveHandler);
      document.removeEventListener("mouseup", endHandler);
      document.removeEventListener("touchmove", moveHandler);
      document.removeEventListener("touchend", endHandler);

      const delta = dragOffset.current;
      dragOffset.current = 0;

      if (Math.abs(delta) < DRAG_THRESHOLD) {
        applyTransform(
          getBaseTranslate(activeIndexRef.current, containerWRef.current),
          true,
        );
        return;
      }

      const step = cardWRef.current + GAP;
      // Snap tại 30% thay vì 50% — nhạy hơn
      const bias = 0.2 * Math.sign(-delta);
      const nearest = Math.round(activeIndexRef.current - delta / step + bias);
      const realTotal = membershipsLenRef.current;

      let targetIndex;
      if (nearest >= realTotal) {
        // Swipe qua phantom → bounce về card đầu tiên
        targetIndex = 0;
      } else {
        targetIndex = Math.max(0, Math.min(realTotal - 1, nearest));
      }

      if (targetIndex === activeIndexRef.current) {
        // State không thay đổi → useEffect sẽ KHÔNG fire
        // Phải tự animate về vị trí đúng
        applyTransform(
          getBaseTranslate(targetIndex, containerWRef.current),
          true,
        );
      } else {
        goTo(targetIndex);
        // useEffect([activeIndex]) sẽ fire và gọi applyTransform
      }
    };

    document.addEventListener("mousemove", moveHandler, { passive: true });
    document.addEventListener("mouseup", endHandler);
    document.addEventListener("touchmove", moveHandler, { passive: true });
    document.addEventListener("touchend", endHandler);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    onDragStart(e.clientX);
  };
  const handleTouchStart = (e) => onDragStart(e.touches[0].clientX);

  const PHANTOM = { id: "__phantom__", isPhantom: true };
  const displayCards = [...memberships, PHANTOM];
  const membershipsLenRef = useRef(memberships.length);
  useEffect(() => {
    membershipsLenRef.current = memberships.length;
  }, [memberships.length]);

  const goTo = (i) => {
    setActiveIndex(Math.max(0, Math.min(memberships.length - 1, i)));
  };

  const handleCardClick = (index) => {
    if (isClickCanceled.current) return;
    goTo(index);
  };

  const getType = (tier) => {
    if (userInfo?.the_thanh_vien_id === tier.id) return "current";
    if (tongChiTieu >= (tier.muc_chi_tieu_tu || 0)) return "past";
    return "locked";
  };

  const selectedTier =
    memberships[Math.min(activeIndex, memberships.length - 1)];
  const currentTierIndex = memberships.findIndex(
    (t) => t.id === userInfo?.the_thanh_vien_id,
  );

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-6">
        <div className="relative">
          <button
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-all
              ${activeIndex === 0 ? "opacity-0 pointer-events-none" : "opacity-100 hover:bg-gray-50"}`}
          >
            <Icons.ArrowForward className="w-4 h-4 rotate-180" />
          </button>

          <div
            ref={containerRef}
            className="overflow-hidden py-4 px-2"
            style={{ cursor: "grab", userSelect: "none" }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div
              ref={trackRef}
              className="flex"
              style={{
                gap: GAP,
                willChange: "transform",
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
              }}
            >
              {displayCards.map((tier, index) => {
                const isActive = index === activeIndex;

                if (tier.isPhantom) {
                  return (
                    <div
                      key="__phantom__"
                      onClick={() => handleCardClick(index)}
                      style={{ width: cardW, flexShrink: 0 }}
                      className={`cursor-pointer transition-all duration-300 ${isActive ? "opacity-100" : "opacity-50"}`}
                    >
                      <div className="h-[150px] mt-3.5 rounded-2xl border-2 border-double border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-3 text-gray-400">
                        <Icons.Star className="w-8 h-8 text-gray-400" />
                        <div className="text-center px-4">
                          <p className="font-bold text-sm text-gray-500">
                            Đang xem hạng cao nhất
                          </p>
                          <p className="text-xs mt-1 text-gray-400">
                            Bạn đã xem hết các hạng thành viên
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                // ── REAL CARDS ──
                const type = getType(tier);
                const nextTier = memberships[index + 1];
                const targetAmount =
                  (tier.muc_chi_tieu_den != null
                    ? tier.muc_chi_tieu_den
                    : null) ??
                  nextTier?.muc_chi_tieu_tu ??
                  null;
                const needMore =
                  targetAmount != null
                    ? Math.max(0, targetAmount - tongChiTieu)
                    : 0;
                const progress = targetAmount
                  ? Math.min((tongChiTieu / targetAmount) * 100, 100)
                  : 100;
                const cardColor = tier.mau_the || "#4b5563";

                // YIQ Contrast Calculation
                let isLight = false;
                if (cardColor && cardColor.startsWith("#")) {
                  let hex = cardColor.replace("#", "");
                  if (hex.length === 3)
                    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                  if (hex.length === 6) {
                    const r = parseInt(hex.substring(0, 2), 16);
                    const g = parseInt(hex.substring(2, 4), 16);
                    const b = parseInt(hex.substring(4, 6), 16);
                    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
                    isLight = yiq >= 128;
                  }
                }

                const theme = isLight
                  ? {
                      text: "text-gray-900",
                      deco1: "bg-black/5",
                      deco2: "bg-black/5",
                      badge: "bg-black/10",
                      iconBg: "bg-black/10",
                      progressTrack: "bg-black/10",
                      progressFill: "bg-gray-800",
                    }
                  : {
                      text: "text-white",
                      deco1: "bg-white/10",
                      deco2: "bg-white/5",
                      badge: "bg-white/20",
                      iconBg: "bg-white/20",
                      progressTrack: "bg-white/20",
                      progressFill: "bg-white",
                    };

                return (
                  <div
                    key={tier.id}
                    onClick={() => handleCardClick(index)}
                    style={{ width: cardW, flexShrink: 0 }}
                    className={`cursor-pointer transition-all duration-300 ${
                      isActive
                        ? "opacity-100 scale-100"
                        : "opacity-55 scale-[0.95]"
                    }`}
                  >
                    <div
                      className="relative h-[175px] rounded-2xl overflow-hidden transition-all duration-400"
                      style={{
                        backgroundColor: cardColor,
                        boxShadow: isActive
                          ? `0 12px 40px -8px ${cardColor}aa`
                          : `0 2px 8px -2px ${cardColor}44`,
                      }}
                    >
                      <div
                        className={`absolute -top-8 -right-8 w-32 h-32 rounded-full ${theme.deco1} pointer-events-none`}
                      />
                      <div
                        className={`absolute -bottom-10 -left-4 w-40 h-40 rounded-full ${theme.deco2} pointer-events-none`}
                      />
                      {type === "past" && (
                        <div
                          className={`relative z-10 h-full p-4 flex flex-col ${theme.text}`}
                        >
                          <span
                            className={`self-start ${theme.badge} px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide`}
                          >
                            {tier.ten_hang}
                          </span>
                          <div className="flex flex-col items-center justify-center flex-1 gap-2">
                            <div
                              className={`w-11 h-11 rounded-full ${theme.iconBg} flex items-center justify-center`}
                            >
                              <Icons.Unlock className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-semibold opacity-90 text-center">
                              Đã mở khóa hạng thành viên
                            </span>
                          </div>
                        </div>
                      )}

                      {/* LOCKED */}
                      {type === "locked" && (
                        <div
                          className={`relative z-10 h-full p-4 flex flex-col ${theme.text}`}
                        >
                          <span
                            className={`self-start ${theme.badge} px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide`}
                          >
                            {tier.ten_hang}
                          </span>
                          <div className="flex flex-col items-center justify-center flex-1 gap-2">
                            <div
                              className={`w-10 h-10 rounded-full ${theme.iconBg} flex items-center justify-center`}
                            >
                              <Icons.Lock className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-semibold opacity-90 text-center px-2">
                              Chưa mở khóa hạng thẻ thành viên
                            </span>
                          </div>
                        </div>
                      )}

                      {/* CURRENT */}
                      {type === "current" && (
                        <div
                          className={`relative z-10 p-4 h-full flex flex-col justify-between ${theme.text} will-change-transform`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`${theme.badge} px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide`}
                            >
                              {tier.ten_hang}
                            </span>
                            <span className="bg-white text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-md">
                              Hạng của bạn
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full ${theme.badge} flex items-center justify-center text-xs font-black shrink-0`}
                            >
                              {hoTen.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-sm truncate">
                              {hoTen}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-baseline text-[11px] font-semibold">
                              <span>
                                Đã mua:{" "}
                                <span className="font-medium">
                                  {fmt(tongChiTieu)}đ
                                </span>
                              </span>
                              {targetAmount != null && (
                                <span className="opacity-70">
                                  / {fmt(targetAmount)}đ
                                </span>
                              )}
                            </div>
                            <div
                              className={`w-full ${theme.progressTrack} h-1.5 rounded-full overflow-hidden`}
                            >
                              <div
                                className={`${theme.progressFill} h-full rounded-full transition-all duration-1000`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-xs font-medium">
                            {nextTier ? (
                              needMore > 0 ? (
                                <>
                                  Cần thêm <strong>{fmt(needMore)}đ</strong> để
                                  lên {nextTier.ten_hang}
                                </>
                              ) : (
                                <>
                                  Đủ điều kiện lên{" "}
                                  <strong>{nextTier.ten_hang}</strong>!
                                </>
                              )
                            ) : (
                              <>Bạn đã đạt hạng thành viên cao nhất!</>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right button */}
          <button
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === memberships.length - 1}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-all
              ${activeIndex === memberships.length - 1 ? "opacity-0 pointer-events-none" : "opacity-100 hover:bg-gray-50"}`}
          >
            <Icons.ArrowForward className="w-4 h-4" />
          </button>
        </div>

        {/* ── PROGRESS LINE ── */}
        <div className="relative mt-4 px-6">
          <div className="relative flex items-start justify-between">
            <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-200" />
            {currentTierIndex >= 0 && memberships.length > 1 && (
              <div
                className="absolute top-3 left-3 h-0.5 bg-red-500 transition-all duration-700"
                style={{
                  width: `${(currentTierIndex / (memberships.length - 1)) * 100}%`,
                }}
              />
            )}
            {memberships.map((tier, index) => {
              const isUnlocked = tongChiTieu >= (tier.muc_chi_tieu_tu || 0);
              const isCurrent = userInfo?.the_thanh_vien_id === tier.id;
              const filled = isUnlocked || isCurrent;
              const isSelected = index === activeIndex;
              return (
                <button
                  key={tier.id}
                  onClick={() => goTo(index)}
                  className="relative flex flex-col items-center gap-1.5 z-10"
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                    ${isSelected ? "scale-125 shadow-md" : ""}
                    ${filled ? "border-red-500 bg-red-500" : "border-gray-300 bg-white"}`}
                  >
                    {filled && <Icons.Tick className="w-5 h-5 text-white" />}
                  </div>
                  <span
                    className={`text-[10px] font-bold whitespace-nowrap ${isSelected ? "text-gray-800" : "text-gray-400"}`}
                  >
                    {tier.ten_hang}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CHI TIẾT HẠNG ── */}
      {selectedTier && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-5">
          <div className="mb-10">
            <SectionTitle>
              Điều kiện thăng cấp {selectedTier.ten_hang}
            </SectionTitle>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                <Icons.Crown className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-base mb-1">
                  Doanh số mua hàng tích lũy
                </p>
                {tongChiTieu >= (selectedTier.muc_chi_tieu_tu || 0) ? (
                  <p className="text-sm text-green-600 font-semibold flex items-center gap-1.5">
                    <Icons.Tick className="w-5 h-5 bg-green-600 text-white rounded-full" />
                    Tuyệt vời! Bạn đã đáp ứng đủ điều kiện của hạng này.
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Cần tích lũy tổng chi tiêu đạt từ{" "}
                    <strong className="text-blue-600 text-lg">
                      {fmt(selectedTier.muc_chi_tieu_tu)}đ
                    </strong>{" "}
                    trở lên.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <SectionTitle>
              Ưu đãi quyền lợi hạng {selectedTier.ten_hang}
            </SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ưu đãi cứng: Giảm giá */}
              {selectedTier.ty_le_giam_gia > 0 && (
                <BenefitRow color="text-emerald-600 bg-emerald-100">
                  Giảm giá trực tiếp{" "}
                  <span className="font-bold text-emerald-600">
                    {selectedTier.ty_le_giam_gia}%
                  </span>{" "}
                  trên tổng hóa đơn thanh toán.
                </BenefitRow>
              )}
              {selectedTier.diem_thuong_them > 0 && (
                <BenefitRow color="text-orange-500 bg-orange-100">
                  Cộng thêm{" "}
                  <span className="font-bold text-orange-500">
                    {selectedTier.diem_thuong_them}%
                  </span>{" "}
                  điểm thưởng tích lũy.
                </BenefitRow>
              )}
              {selectedTier.mo_ta_quyen_loi &&
                selectedTier.mo_ta_quyen_loi
                  .split("\n")
                  .filter((line) => line.trim() !== "")
                  .map((line, idx) => (
                    <BenefitRow
                      key={idx}
                      color="text-blue-600 bg-blue-100"
                      icon={
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      }
                    >
                      {line.trim()}
                    </BenefitRow>
                  ))}

              {/* Báo trống nếu không có gì */}
              {selectedTier.ty_le_giam_gia === 0 &&
                selectedTier.diem_thuong_them === 0 &&
                !selectedTier.mo_ta_quyen_loi && (
                  <p className="md:col-span-2 text-center text-gray-400 italic py-6 text-sm bg-gray-50 rounded-xl">
                    Chưa có chính sách ưu đãi cụ thể cho hạng thành viên này.
                  </p>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SectionTitle = ({ children }) => (
  <div className="flex flex-col items-center mb-4">
    <h3 className="text-gray-700 font-bold uppercase text-lg">{children}</h3>
  </div>
);

const BenefitRow = ({ children, color }) => (
  <div className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-all items-center">
    <div className={`w-3 h-3 rounded-full shrink-0 ${color} animate-pulse`} />
    <p className="text-sm text-gray-700 font-medium leading-relaxed">
      {children}
    </p>
  </div>
);

export default MembershipCarousel;
