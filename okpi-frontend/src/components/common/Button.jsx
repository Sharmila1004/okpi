export default function Button({
  children,
  className = "",
  type = "button",
  variant = "primary",
  size = "md",
  ariaLabel,
  ...props
}) {
  const variants = {
    primary:
      "bg-ink text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)] hover:bg-[#25324b]",
    accent: "bg-[#4f46e5] text-white shadow-[0_10px_24px_rgba(79,70,229,0.22)] hover:bg-[#4338ca]",
    secondary: "bg-white text-ink ring-1 ring-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-700"
  };

  const sizes = {
    sm: "h-10 rounded-[16px] px-3 text-sm",
    md: "h-12 rounded-[18px] px-5 text-[15px]",
    lg: "h-14 rounded-[20px] px-6 text-base",
    icon: "h-12 w-12 rounded-[18px] px-0"
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
}
