export default function Button({
  children,
  className = "",
  type = "button",
  variant = "primary",
  ...props
}) {
  const variants = {
    primary: "bg-ink text-white hover:bg-ink/90",
    secondary: "bg-white text-ink ring-1 ring-ink/10 hover:bg-sand",
    danger: "bg-rose-600 text-white hover:bg-rose-700"
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
