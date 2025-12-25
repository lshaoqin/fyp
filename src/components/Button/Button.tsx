import React, { ReactNode } from "react";

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  className = "",
  children,
  icon,
  type = "button",
  variant = "primary",
  size = "md",
}) => {
  const baseStyles =
    "flex items-center gap-3 font-bold rounded-lg transition-colors font-bold";

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-8 py-4 text-base",
    lg: "px-12 py-6 text-lg",
  };

  const variantStyles = {
    primary:
      "text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "text-gray-600 dark:text-gray-400 border-2 border-gray-400 hover:text-yellow-500 hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950 transition-all",
    danger:
      "text-red-600 dark:text-red-400 border-2 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-950",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      style={{ fontFamily: "Verdana, Arial, Helvetica, sans-serif" }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
