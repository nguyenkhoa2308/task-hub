import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  LayoutDashboard,
  Users,
  CalendarCheck,
  Zap,
  Shield,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard trực quan",
    description:
      "Tổng quan toàn bộ công việc với giao diện đẹp mắt, dễ theo dõi tiến độ.",
  },
  {
    icon: Users,
    title: "Cộng tác nhóm",
    description:
      "Phân công, theo dõi và phối hợp công việc cùng đội nhóm một cách dễ dàng.",
  },
  {
    icon: CalendarCheck,
    title: "Quản lý deadline",
    description:
      "Không bao giờ trễ hạn với hệ thống nhắc nhở và lịch thông minh.",
  },
  {
    icon: Zap,
    title: "Nhanh chóng & hiệu quả",
    description:
      "Tạo task chỉ trong vài giây, tự động sắp xếp theo độ ưu tiên.",
  },
  {
    icon: Shield,
    title: "Bảo mật dữ liệu",
    description:
      "Dữ liệu của bạn luôn được mã hóa và bảo vệ với tiêu chuẩn cao nhất.",
  },
  {
    icon: Sparkles,
    title: "Gợi ý thông minh",
    description:
      "AI hỗ trợ phân tích hiệu suất và đề xuất cách tối ưu workflow.",
  },
];

const steps = [
  {
    step: "01",
    title: "Tạo tài khoản",
    description: "Đăng ký miễn phí chỉ với email, bắt đầu ngay trong 30 giây.",
  },
  {
    step: "02",
    title: "Tạo workspace",
    description: "Thiết lập không gian làm việc cho cá nhân hoặc nhóm.",
  },
  {
    step: "03",
    title: "Quản lý task",
    description: "Thêm, phân công và theo dõi tiến độ từng công việc dễ dàng.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-white selection:bg-blue-600/10 font-sans">
      {/* ───── Navbar ───── */}
      <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm transition-transform group-hover:scale-105">
              T
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Task Hub
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="default" asChild>
              <Link href="/auth/sign-in">Đăng nhập</Link>
            </Button>
            <Button size="default" asChild>
              <Link href="/auth/sign-up">
                Bắt đầu miễn phí
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-br from-blue-100/60 via-indigo-50/40 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-20 -right-40 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-sky-100/50 to-transparent blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-20 text-center sm:pt-32 sm:pb-28">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-1.5 text-sm font-medium text-blue-700 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Quản lý công việc thông minh
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Tổ chức công việc.{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Đạt hiệu suất tối đa.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl">
            Task Hub giúp bạn và đội nhóm quản lý mọi công việc một cách đơn
            giản, trực quan và hiệu quả — từ ý tưởng đến hoàn thành.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/auth/sign-up">
                Bắt đầu ngay — Miễn phí
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base"
              asChild
            >
              <Link href="#features">Khám phá tính năng</Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-14 flex flex-col items-center gap-3 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-4 h-4 text-amber-400 fill-amber-400"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p>
              Được <span className="font-semibold text-gray-600">2,000+</span>{" "}
              người dùng tin tưởng
            </p>
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section id="features" className="scroll-mt-20 bg-gray-50/70 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Tính năng
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Mọi thứ bạn cần để làm việc hiệu quả
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-500 text-lg">
              Từ quản lý cá nhân đến phối hợp nhóm, Task Hub cung cấp đầy đủ
              công cụ cho mọi nhu cầu.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-gray-200/60 bg-white p-7 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── How it works ───── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Cách hoạt động
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Bắt đầu chỉ trong 3 bước
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((item, index) => (
              <div key={item.step} className="relative text-center">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="pointer-events-none absolute top-8 left-[calc(50%+32px)] hidden h-px w-[calc(100%-64px)] bg-gradient-to-r from-blue-200 to-blue-100 sm:block" />
                )}
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-blue-600/20">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Sẵn sàng nâng cao hiệu suất?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100/90">
            Tham gia cùng hàng nghìn người đã sử dụng Task Hub để quản lý công
            việc hiệu quả hơn mỗi ngày.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="h-12 px-8 text-base bg-white text-blue-700 hover:bg-blue-50"
              asChild
            >
              <Link href="/auth/sign-up">
                Tạo tài khoản miễn phí
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-blue-200/70">
            Không cần thẻ tín dụng · Miễn phí mãi mãi
          </p>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold">
              T
            </div>
            <span className="text-sm font-semibold text-gray-900">
              Task Hub
            </span>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Task Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
