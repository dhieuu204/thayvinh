# new-frontend

Frontend mới cho dự án, xây dựng lại giao diện với thiết kế đẹp hơn, vẫn dùng cùng backend và logic API.

## Tech Stack

- **React 19** + **Vite**
- **Tailwind CSS v4**
- **React Router DOM v7**
- **Framer Motion** — animations
- **Lucide React** — icon library
- **Swiper** — carousel/slider
- **React Toastify** — notifications
- **Axios** + native fetch

## Cấu trúc thư mục

```
src/
├── lib/
│   ├── api.js          # Base URL từ .env
│   └── fetch.js        # fetchModel helper (GET)
├── pages/              # Tất cả các trang
├── components/         # UI components chia nhỏ
│   ├── layout/         # Header, Footer, Sidebar
│   ├── ui/             # Button, Badge, Card... dùng lại
│   └── ...
├── App.jsx             # Routing
├── main.jsx
└── index.css           # Global styles + Tailwind
```

## Khởi chạy

```bash
npm install
npm run dev             # http://localhost:5174
```

## Biến môi trường

Copy `.env.example` → `.env` và điền URL backend:

```
VITE_API_URL=http://localhost:5000
```
