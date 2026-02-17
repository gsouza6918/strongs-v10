import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "font-display uppercase tracking-wider py-2 px-4 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-strongs-gold to-yellow-600 text-strongs-darker font-bold hover:brightness-110",
    secondary: "bg-strongs-green text-white hover:bg-teal-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-strongs-gold border border-strongs-gold hover:bg-strongs-gold/10"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};