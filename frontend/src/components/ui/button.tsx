import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link' | string | any;
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'default' | string | any;
  asChild?: boolean;
}

export const buttonVariants = ({ variant, size, className }: any = {}) => {
  return className || "";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ variant = 'secondary', size = 'md', className = '', children, ...props }, ref) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
  
  const variants: any = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    outline: "border border-slate-200 bg-transparent hover:bg-slate-100 text-slate-900",
    link: "underline-offset-4 hover:underline text-slate-900",
  };

  const sizes: any = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10",
    default: "h-10 px-4 py-2"
  };

  return (
    <button 
      ref={ref}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
