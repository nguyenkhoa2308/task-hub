# Task Hub

Ứng dụng quản lý workspace, dự án và công việc dành cho nhóm làm việc. Task Hub kết hợp Kanban, danh sách công việc, cộng tác theo thời gian thực, phân quyền và báo cáo trong một giao diện responsive.

## Demo

- Frontend: https://task-hub-wine-ten.vercel.app
- Backend health: https://task-hub-rftm.onrender.com/health
- API Docs: https://task-hub-rftm.onrender.com/api/docs
- OpenAPI JSON: https://task-hub-rftm.onrender.com/api/docs-json

> Backend đang chạy trên Render Free nên request đầu tiên sau thời gian không hoạt động có thể cần chờ máy chủ khởi động.

## Tính năng chính

- Quản lý nhiều workspace, dự án và thành viên.
- Phân quyền Owner, Admin, Member và Viewer ở cả frontend lẫn backend.
- Theo dõi công việc bằng Kanban hoặc List View; hỗ trợ kéo thả và sắp xếp.
- Subtask, milestone, độ ưu tiên, hạn chót, người phụ trách và tệp đính kèm.
- Bình luận phân cấp, trả lời, mention thành viên và điều hướng đến bình luận được nhắc.
- Thông báo và cập nhật bình luận theo thời gian thực bằng Server-Sent Events.
- Dashboard thống kê tiến độ, trạng thái dự án, độ ưu tiên và công việc quá hạn.
- Tìm kiếm toàn cục workspace, dự án và công việc.
- Lưu trữ, thùng rác, khôi phục, chọn nhiều và xóa vĩnh viễn.
- Nhật ký hoạt động và xuất báo cáo.
- Upload avatar/tệp qua Cloudinary.
- Giao diện responsive riêng cho desktop, tablet và mobile.

## Công nghệ

### Frontend

- Next.js 16, React 19 và TypeScript
- Tailwind CSS, shadcn/ui và Ant Design
- TanStack Query và Redux Toolkit
- React Hook Form, Zod và Recharts

### Backend

- NestJS 11 và TypeScript
- MongoDB Atlas và Mongoose
- JWT trong HttpOnly Cookie, Passport và bcrypt
- Arcjet, Helmet, rate limiting và validation
- Server-Sent Events, scheduled jobs và Swagger/OpenAPI
- Cloudinary và Nodemailer

### Hạ tầng

- Vercel: frontend
- Render: backend
- MongoDB Atlas: database
- Cloudinary: ảnh và tệp

## Kiến trúc

```text
Trình duyệt
   │
   ├── Next.js trên Vercel
   │      ├── TanStack Query
   │      ├── Redux Toolkit
   │      └── Responsive UI
   │
   └── NestJS API trên Render
          ├── JWT HttpOnly Cookie
          ├── REST API + SSE
          ├── MongoDB Atlas
          ├── Cloudinary
          └── SMTP
```

Repository được tổ chức theo monorepo:

```text
task-hub/
├── FE/   # Next.js frontend
└── BE/   # NestJS backend
```

## Chạy local

Yêu cầu Node.js và một MongoDB database.

### Backend

```bash
cd BE
npm install
```

Tạo file `.env` dựa trên `BE/.env.example`, sau đó chạy:

```bash
npm run start:dev
```

Backend mặc định chạy tại http://localhost:2308.

### Frontend

```bash
cd FE
npm install
```

Tạo `FE/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:2308
```

Khởi động frontend:

```bash
npm run dev
```

Mở http://localhost:3000.

## Biến môi trường

Backend yêu cầu:

```env
NODE_ENV=development
PORT=2308
MONGODB_URI=
FRONTEND_URL=http://localhost:3000

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

ARCJET_ENV=development
ARCJET_KEY=

MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=
MAIL_PASS=
MAIL_FROM=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Không commit file `.env`, token, mật khẩu hoặc API secret lên repository.

## API Docs

Swagger UI được phục vụ tại:

```text
GET /api/docs
```

OpenAPI JSON:

```text
GET /api/docs-json
```

API sử dụng hai HttpOnly Cookie:

- `access_token`: phiên truy cập ngắn hạn.
- `refresh_token`: làm mới phiên đăng nhập.

Để thử endpoint được bảo vệ trong Swagger, hãy gọi `POST /auth/login` trước. Trình duyệt sẽ lưu cookie và Swagger gửi cookie trong các request tiếp theo.

## Kiểm tra chất lượng

```bash
# Frontend
cd FE
npm run build
npm run lint

# Backend
cd BE
npm run build
npm test
```

## Triển khai

### Vercel

```text
Root Directory: FE
Environment: NEXT_PUBLIC_API_URL=https://<render-service>.onrender.com
```

### Render

```text
Root Directory: BE
Build Command: npm ci --include=dev && npm run build
Start Command: npm run start:prod
Health Check Path: /health
```

Trong production, `NODE_ENV=production` để cookie cross-site sử dụng `Secure; SameSite=None`.

## Tác giả

Nguyễn Đức Khoa
