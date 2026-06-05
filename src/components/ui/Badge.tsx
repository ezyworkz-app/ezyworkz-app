import React from "react";

export interface BadgeProps {
  variant?:
  | "primary"
  | "secondary"
  | "tertiary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  variant = "primary",
  children,
  className = "",
}) => {
  const variantClasses = {
    primary: "bg-brand-50 text-brand-700 border-brand-100/50",
    secondary: "bg-brand-500 text-white border-brand-600/50",
    tertiary: "bg-cyan-50 text-cyan-700 border-cyan-100/50",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100/50",
    warning: "bg-amber-50/50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-100/50",
    neutral: "bg-gray-50 text-gray-700 border-gray-100/50",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
