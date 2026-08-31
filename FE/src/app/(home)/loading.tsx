import { Skeleton } from "@/components/ui/skeleton";

export default function HomeRouteLoading() {
  return (
    <div className="w-full space-y-6 pb-12" aria-label="Đang tải nội dung">
      <div className="border-b border-slate-200/80 pb-5">
        <Skeleton className="h-7 w-52 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3"><Skeleton className="size-10 rounded-xl" /><Skeleton className="h-5 w-2/3" /></div>
            <Skeleton className="mt-5 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-4/5" />
            <Skeleton className="mt-6 h-8 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
