import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Account",
  description: "Log in or join Cycle Found Community with a one-time email code.",
};

export default function AuthPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(82,125,49,0.12),_transparent_55%),linear-gradient(180deg,#f8f7f4_0%,#eef3e8_100%)]"
      />
      <div className="relative mx-auto flex w-full max-w-[480px] flex-col px-6 py-12 sm:py-16">
        <Suspense
          fallback={
            <div className="h-[28rem] animate-pulse rounded-[14px] border border-line bg-white" />
          }
        >
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}
