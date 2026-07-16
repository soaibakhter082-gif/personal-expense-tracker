type AuthNoticeProps = {
  variant: "success" | "error" | "info";
  message: string;
};

const variantClasses: Record<AuthNoticeProps["variant"], string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-slate-200 bg-white text-slate-700",
};

export default function AuthNotice({ variant, message }: AuthNoticeProps) {
  if (!message) {
    return null;
  }

  const liveRegionProps =
    variant === "error"
      ? { role: "alert" }
      : { role: "status", "aria-live": "polite" as const };

  return (
    <div
      {...liveRegionProps}
      className={`rounded-xl border px-4 py-3 text-sm font-medium leading-6 shadow-sm sm:px-5 ${variantClasses[variant]}`}
    >
      {message}
    </div>
  );
}
