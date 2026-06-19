import React, { useState, useEffect } from "react";

const ScrollToTopButton = () => {
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) setShowTopBtn(true);
      else setShowTopBtn(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!showTopBtn) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-36 md:bottom-8 right-8 z-[100] w-12 h-12 bg-gray-800 text-white rounded-full text-2xl shadow-xl hover:bg-red-600 transition-colors cursor-pointer flex items-center justify-center"
      aria-label="Lên đầu trang"
    >
      ↑
    </button>
  );
};

export default ScrollToTopButton;
