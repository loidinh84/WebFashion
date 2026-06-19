WebEcommerce — Website Bán Đồ Công Nghệ
Website thương mại điện tử chuyên đồ công nghệ điện tử, xây dựng bằng Node.js + React.

Công nghệ sử dụng
Phần Công nghệ FrontendReact + ViteBackendNode.js + ExpressDatabaseSQL ServerORM(Sequelize / mssql — điền vào)

Yêu cầu cài đặt
Trước khi chạy project, máy cần có:

Node.js
SQL Server
Git


Hướng dẫn cài đặt
1. Clone project về máy
bashgit clone https://github.com/loidinh84/WebEcommerce.git
cd WebEcommerce

2. Tạo database
Mở SQL Server Management Studio (SSMS), chạy file:
cellphones_database_v2.sql

3. Cấu hình Backend
bash cd backend
Tạo file .env trong thư mục backend/ với nội dung sau:
envPORT=5000

DB_SERVER=localhost
DB_NAME=WebEcommerce
DB_USER=sa
DB_PASSWORD=mat_khau_cua_ban
DB_PORT=1433

JWT_SECRET=tu_dat_chuoi_bi_mat_o_day
JWT_EXPIRES_IN=7d
Cài dependencies và chạy:
bash npm install
node server.js
Backend chạy tại: http://localhost:5000

4. Cấu hình Frontend
bash cd ../frontend
npm install
npm run dev
Frontend chạy tại: http://localhost:5173

Cấu trúc thư mục
WebEcommerce/
├── backend/
│   ├── config/          # Kết nối database
│   ├── controllers/     # Xử lý logic request
│   ├── middlewares/     # Xác thực JWT, phân quyền
│   ├── models/          # Cấu trúc dữ liệu
│   ├── routers/         # Định nghĩa API routes
│   ├── services/        # Logic nghiệp vụ
│   ├── uploads/         # Ảnh upload (không đưa lên git)
│   ├── utils/           # Hàm tiện ích dùng chung
│   ├── .env             # Biến môi trường (không đưa lên git)
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/      # Ảnh, icon, font
│       ├── components/  # Component dùng chung
│       ├── hooks/       # Custom hooks
│       ├── pages/       # Các trang
│       ├── services/    # Gọi API (axios)
│       ├── store/       # Quản lý state
│       └── utils/       # Hàm tiện ích
│
├── .gitignore
└── README.md

Thành viên nhóm
Họ tên              MSSV            Phụ trách
Đinh Thành Lợi      2380601285      Backend
Vũ Thái Tài         2380601970      Frontend
                                    Database

Lưu ý quan trọng

Không commit file .env lên git — chứa thông tin bảo mật
Không commit thư mục uploads/ lên git — dung lượng lớn
Mỗi thành viên tự tạo file .env trên máy theo hướng dẫn mục 3
