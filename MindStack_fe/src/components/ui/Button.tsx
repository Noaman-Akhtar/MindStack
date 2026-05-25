import type { ReactNode } from "react";

interface ButtonProps {
  variant: "primary" | "secondary";
  size: "sm" | "md" | "lg" | "full";
  text?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const variantStyles = {
  primary: "bg-[#d4bbff] text-[#0F0F1A]",
  secondary: "bg-[#2D2B55] text-[#C4C2FF]",
};

const sizeStyles = {
  sm: "py-1 sm:px-3 px-1 sm:text-sm text-xs",
  md: "py-1.5 sm:px-3 px-1 sm:text-base text-xs",
  lg: "py-3 px-6 text-lg",
  full: "w-full flex justify-center items-center h-12 text-base",
};

const defaultStyles =
  "rounded-md flex items-center gap-2 font-medium transition-transform hover:brightness-90 duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer";

export const Button = (props: ButtonProps) => {
  return (
    <button
      className={`
        ${variantStyles[props.variant]} 
        ${sizeStyles[props.size]} 
        ${defaultStyles}
      `}
      onClick={props.onClick}
      disabled={props.loading || props.disabled}
    >
      {props.startIcon && <span className="flex items-center">{props.startIcon}</span>}
      <span>{props.text}</span>
      {props.endIcon && <span className="flex items-center">{props.endIcon}</span>}
    </button>
  );
};
