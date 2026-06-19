import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HeroBanner from "../components/HeroBanner";
import SidebarMenu from "../components/SideBarMenu";
import ProductSection from "../components/ProductSection";
import AccessoryBar from "../components/AccessoryBar";
import ShopReviews from "../components/ShopReviews";
import { Toaster } from "react-hot-toast";
import BASE_URL from "../config/api";

function Home() {
  const [homeConfig, setHomeConfig] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeConfig = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/cau-hinh/home`);
        setHomeConfig(res.data);
      } catch (error) {
        console.error("Lỗi lấy cấu hình trang chủ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeConfig();
  }, []);

  return (
    <div className="bg-[#F3F4F6] min-h-screen font-sans relative flex flex-col">
      <Header />
      <Toaster position="bottom-center" />

      <main className="flex-grow w-full max-w-[1280px] mx-auto px-2 sm:px-4 mt-2 sm:mt-3 mb-4 sm:mb-10 pb-16 md:pb-0">
        {/* TẦNG 1: Sidebar + Hero Slideshow */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* SidebarMenu chỉ hiện trên desktop lg+ */}
          <div className="hidden lg:block w-full lg:w-1/4 xl:w-1/5">
            <SidebarMenu />
          </div>
          {/* HeroBanner full-width trên mobile/tablet */}
          <div className="w-full lg:w-3/4 xl:w-4/5">
            <HeroBanner />
          </div>
        </div>

        {/* CÁC TẦNG NỘI DUNG LINH ĐỘNG */}
        {loading ? (
          <div className="mt-4 space-y-6">
            <div className="w-full h-80 bg-white rounded-2xl animate-pulse" />
            <div className="w-full h-80 bg-white rounded-2xl animate-pulse" />
          </div>
        ) : (
          homeConfig.map((section) => {
            if (section.loai_hien_thi === "ProductSection") {
              return (
                <ProductSection
                  key={section.id}
                  title={section.ten_phan}
                  tab1={
                    section.ten_tab_1 || section.ten_phan?.split("&")[0]?.trim()
                  }
                  tab2={
                    section.ten_tab_2 || section.ten_phan?.split("&")[1]?.trim()
                  }
                  danhMucId1={section.danh_muc_id_1}
                  danhMucId2={section.danh_muc_id_2}
                />
              );
            }
            if (section.loai_hien_thi === "AccessoryBar") {
              return (
                <AccessoryBar
                  key={section.id}
                  title={section.ten_phan}
                  data={section.du_lieu_json || []}
                />
              );
            }
            return null;
          })
        )}

        <ShopReviews />
      </main>

      <Footer />
    </div>
  );
}

export default Home;
