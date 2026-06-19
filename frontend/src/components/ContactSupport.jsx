import React, { useState, useEffect, useRef, useContext } from "react";
import * as Images from "../assets/images/index";
import * as Icons from "../assets/icons/index";
import BASE_URL from "../config/api";
import { StoreContext } from "../context/StoreContext";
import { AuthContext } from "../context/AuthContext";
import ShopFeedbackModal from "./ShopFeedbackModal";

const ContactSupport = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  // Hướng mở: true = lên trên, false = xuống dưới
  const [openUpward, setOpenUpward] = useState(true);

  const chatEndRef = useRef(null);
  const buttonRef = useRef(null);

  // DRAG & DROP
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [moved, setMoved] = useState(false);

  const { storeConfig } = useContext(StoreContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const tenShop = storeConfig?.ten_cua_hang || "LTLShop";
  
  // Tách biệt lịch sử trò chuyện theo từng tài khoản (hoặc khách vãng lai)
  const userSuffix = user ? `_${user.ma_tai_khoan || user.id || user.email || "user"}` : "_guest";
  const STORAGE_KEY = `chat_history${userSuffix}`;
  
  const DEFAULT_MSG = { role: "bot", text: `Chào bạn nhé! Tôi là trợ lý của ${tenShop} đây. Bạn đang cần tôi tư vấn món đồ công nghệ nào không?` };

  useEffect(() => {
    // Không load khi storeConfig chưa sẵn
    if (!storeConfig) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      setMessages(parsed.length > 0 ? parsed : [DEFAULT_MSG]);
    } catch {
      setMessages([DEFAULT_MSG]);
    }
  }, [storeConfig?.ten_cua_hang, STORAGE_KEY]);

  // Đồng bộ messages vào localStorage mỗi khi thay đổi
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, STORAGE_KEY]);

  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([DEFAULT_MSG]);
  };

  // Tính toán hướng mở dựa trên vị trí nút so với màn hình
  const calcDirection = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setOpenUpward(rect.top > window.innerHeight / 2);
  };

  // DRAG handlers
  const handleStart = (e) => {
    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
    setMoved(false);
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    const boundedX = Math.min(Math.max(newX, -window.innerWidth + 100), 20);
    const boundedY = Math.min(Math.max(newY, -window.innerHeight + 150), 20);
    if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) setMoved(true);
    setPosition({ x: boundedX, y: boundedY });
  };

  const handleEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
    } else {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, position, dragStart]);

  const handleToggleMenu = () => {
    calcDirection();
    setShowMenu((prev) => !prev);
    if (showChat) setShowChat(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    const newMessages = [...messages, { role: "user", text: userMsg }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    try {
      // Gửi toàn bộ lịch sử để AI có ngữ cảnh
      const history = newMessages.map((m) => ({ role: m.role, text: m.text }));
      const response = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "Bạn ơi, tôi hơi lag, đợi tôi tí nhé!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  // Class hướng cho cả menu và chat box
  const popupDir = openUpward
    ? "bottom-full mb-3 animate-in slide-in-from-bottom-4"
    : "top-full mt-3 animate-in slide-in-from-top-4";

  return (
    <div
      className="fixed z-[9999] font-sans text-gray-800 select-none"
      style={{
        bottom: `calc(env(safe-area-inset-bottom, 0px) + ${80 - position.y}px)`,
        right: `calc(24px - ${position.x}px)`,
        touchAction: "none",
        transition: isDragging ? "none" : "bottom 0.1s ease-out, right 0.1s ease-out",
      }}
    >
      {/* Wrapper chứa nút + popup absolute */}
      <div className="relative flex flex-col items-end" ref={buttonRef}>

        {/* ── Menu Popup ──────────────────────────────────────────── */}
        {showMenu && (
          <div className={`absolute right-0 flex flex-col items-end gap-2 w-max ${popupDir} fade-in duration-200`}>
            <button
              onClick={() => { setShowFeedbackModal(true); setShowMenu(false); }}
              className="bg-white px-4 py-2.5 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Icons.KhieuNai className="w-5 h-5 text-red-400" />
              Khiếu nại | Góp ý
            </button>
            <button
              onClick={() => window.open(storeConfig?.zalo || "https://zalo.me/", "_blank")}
              className="bg-white px-4 py-2.5 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <img src={Images.Zalo} className="w-5 h-5" alt="zalo" />
              Liên hệ Zalo
            </button>
            <button
              onClick={() => { calcDirection(); setShowChat(true); setShowMenu(false); }}
              className="bg-white px-4 py-2.5 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Icons.ChatAI className="w-5 h-5 text-indigo-600" />
              Chat với AI
            </button>
          </div>
        )}

        {/* ── Chat Box ────────────────────────────────────────────── */}
        {showChat && (
          <div className={`absolute right-0 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden ${popupDir} fade-in duration-300`}>
            {/* Header */}
            <div className="bg-red-500 p-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isLoading ? "bg-yellow-400 animate-bounce" : "bg-green-400"}`} />
                <span className="font-bold">{tenShop} Support</span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="hover:bg-red-600 p-1 rounded-full cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 bg-gray-50 p-4 text-sm overflow-y-auto space-y-4 scrollbar-hide">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm leading-relaxed
                    ${msg.role === "user"
                      ? "bg-red-500 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-none font-medium"}`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input + nút xóa lịch sử */}
            <div className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
              <button
                onClick={handleClearHistory}
                title="Xóa lịch sử trò chuyện"
                className="text-gray-400 hover:text-red-400 p-2 rounded-full hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
              <input
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-red-400 transition-colors"
                placeholder="Bạn hỏi tôi gì đi..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                className="bg-red-500 text-white p-2.5 rounded-full hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Nút Liên hệ chính ───────────────────────────────────── */}
        <div className="relative group mt-1">
          {/* Nút ẩn widget */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
            className="absolute -top-2 -right-2 w-4 h-4 bg-gray-200 text-black rounded-full flex items-center justify-center shadow-lg cursor-pointer z-10 border border-white hover:bg-gray-300 transition-colors"
            title="Tắt hỗ trợ"
          >
            <Icons.Close className="w-3 h-3" />
          </button>

          {/* Nút kéo + toggle menu */}
          <button
            onMouseDown={handleStart}
            onTouchStart={handleStart}
            onClick={() => { if (!moved) handleToggleMenu(); }}
            className={`bg-red-500 hover:bg-red-600 text-white p-3.5 md:px-6 md:py-3.5 rounded-full md:rounded-xl shadow-xl flex items-center gap-2 font-bold transition-all cursor-move active:scale-95
              ${showMenu ? "ring-4 ring-red-200 bg-red-600" : ""}
              ${isDragging ? "opacity-70 scale-110" : ""}`}
          >
            <span className="hidden md:inline">Liên hệ</span>
            <Icons.Support className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      <ShopFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </div>
  );
};

export default ContactSupport;
