import React, { useState, useEffect } from "react";

const useAdminScreenGuard = () => {
  const getScreenInfo = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    if (width >= 1024) return { allowed: true, width, height, isLandscape };

    if (width >= 768 && isLandscape) return { allowed: true, width, height, isLandscape };

    return { allowed: false, width, height, isLandscape };
  };

  const [screenInfo, setScreenInfo] = useState(getScreenInfo);

  useEffect(() => {
    const handleResize = () => setScreenInfo(getScreenInfo());
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", () => {
      setTimeout(() => setScreenInfo(getScreenInfo()), 100);
    });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return screenInfo;
};

const AdminDesktopOnly = ({ children }) => {
  const { allowed, width, isLandscape } = useAdminScreenGuard();

  if (allowed) return <>{children}</>;

  return (
    <div className="admin-desktop-guard">
      {/* Animated background blobs */}
      <div className="admin-guard-bg">
        <div className="guard-orb guard-orb-1" />
        <div className="guard-orb guard-orb-2" />
        <div className="guard-orb guard-orb-3" />
      </div>

      <div className="admin-guard-card">
        {/* Icon circle */}
        <div className="guard-icon-wrapper">
          <div className="guard-icon-ring" />
          <svg
            className="guard-icon"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Monitor frame */}
            <rect x="6" y="10" width="52" height="34" rx="4" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="2.5" />
            <rect x="11" y="15" width="42" height="24" rx="2" fill="white" fillOpacity="0.15" />
            {/* Stand */}
            <path d="M26 44 L24 54 M38 44 L40 54" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M20 54 L44 54" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            {/* Content lines */}
            <line x1="16" y1="22" x2="30" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
            <line x1="16" y1="27" x2="26" y2="27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
            <line x1="16" y1="32" x2="28" y2="32" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
            {/* Chart bars */}
            <rect x="36" y="28" width="5" height="9" rx="1" fill="white" fillOpacity="0.6" />
            <rect x="43" y="24" width="5" height="13" rx="1" fill="white" fillOpacity="0.9" />
          </svg>
        </div>

        {/* Badge */}
        <div className="guard-badge">
          <span className="guard-badge-dot" />
          Khu vực quản trị
        </div>

        <h1 className="guard-title">Yêu cầu màn hình lớn hơn</h1>

        <p className="guard-description">
          Vui lòng sử dụng màn hình lớn hơn hoặc xoay thiết bị sang chế độ ngang để có thể sử dụng thuận tiện hơn.
        </p>

        {/* Tip box */}
        <div className="guard-tip">
          <svg viewBox="0 0 20 20" fill="currentColor" className="guard-tip-icon">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {!isLandscape
            ? "Thử xoay thiết bị sang chế độ ngang để tiếp tục."
            : "Vui lòng chuyển sang máy tính hoặc màn hình lớn hơn."}
        </div>
      </div>

      <style>{`
        /* ─── Wrapper ─── */
        .admin-desktop-guard {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: linear-gradient(145deg, #eff6ff 0%, #f0f9ff 45%, #f5f3ff 100%);
          overflow: hidden;
        }

        /* ─── Background blobs ─── */
        .admin-guard-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .guard-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.45;
          animation: guardOrbFloat 8s ease-in-out infinite;
        }
        .guard-orb-1 {
          width: 420px; height: 420px;
          background: #bfdbfe;
          top: -140px; left: -140px;
          animation-delay: 0s;
        }
        .guard-orb-2 {
          width: 360px; height: 360px;
          background: #c7d2fe;
          bottom: -110px; right: -110px;
          animation-delay: 3s;
        }
        .guard-orb-3 {
          width: 280px; height: 280px;
          background: #bae6fd;
          top: 50%; left: 50%;
          animation-name: guardOrbFloat3;
          animation-delay: 1.5s;
        }
        @keyframes guardOrbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes guardOrbFloat3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50%       { transform: translate(-50%, -60%) scale(1.1); }
        }

        /* ─── Card ─── */
        .admin-guard-card {
          position: relative;
          z-index: 1;
          max-width: 460px;
          width: 100%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 2.5rem 2rem;
          text-align: center;
          box-shadow:
            0 4px 6px rgba(99, 102, 241, 0.04),
            0 12px 40px rgba(99, 102, 241, 0.10),
            0 0 0 1px rgba(226, 232, 240, 0.6);
          animation: guardCardIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes guardCardIn {
          from { opacity: 0; transform: translateY(32px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }

        /* ─── Icon ─── */
        .guard-icon-wrapper {
          position: relative;
          width: 90px;
          height: 90px;
          margin: 0 auto 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .guard-icon-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          animation: guardRingPulse 2.5s ease-in-out infinite;
        }
        @keyframes guardRingPulse {
          0%, 100% { transform: scale(1);    opacity: 1;    }
          50%       { transform: scale(1.12); opacity: 0.75; }
        }
        .guard-icon {
          width: 56px;
          height: 56px;
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3));
        }

        /* ─── Badge ─── */
        .guard-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          padding: 4px 14px;
          border-radius: 999px;
          margin-bottom: 1rem;
        }
        .guard-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3b82f6;
          animation: guardDotBlink 1.5s ease-in-out infinite;
        }
        @keyframes guardDotBlink {
          0%, 100% { opacity: 1;   }
          50%       { opacity: 0.3; }
        }

        /* ─── Text ─── */
        .guard-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.75rem;
          line-height: 1.3;
        }
        .guard-description {
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.75;
          margin: 0 0 1.5rem;
        }

        /* ─── Tip ─── */
        .guard-tip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 10px 14px;
          color: #78350f;
          font-size: 0.83rem;
          font-weight: 500;
          text-align: left;
        }
        .guard-tip-icon {
          width: 17px;
          height: 17px;
          flex-shrink: 0;
          color: #d97706;
        }
      `}</style>
    </div>
  );
};

export default AdminDesktopOnly;
