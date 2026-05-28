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
    primary: "bg-ink text-white hover:opacity-90",
    accent: "bg-ink text-white hover:opacity-90",
    secondary: "bg-white text-ink ring-1 ring-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-700"
  };

  const sizes = {
    sm: "h-8 rounded-md px-2 text-sm",
    md: "h-10 rounded-md px-4 text-sm",
    lg: "h-12 rounded-md px-5 text-sm",
    icon: "h-10 w-10 rounded-md px-0"
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
