import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-display uppercase tracking-wider font-bold py-3 px-8 transform transition-all duration-150 active:scale-95 border-2 relative overflow-hidden group";
  
  const variants = {
    // White border, White text, Black BG -> Hover: White BG, Black Text
    primary: "bg-black border-white text-white hover:bg-white hover:text-black",
    // Grey border, Grey text -> Hover: White border, White text
    secondary: "bg-black border-gray-600 text-gray-400 hover:border-white hover:text-white",
    // Black border, White text (Keep it stark) -> Hover: Red-ish/Grey for danger? Let's keep it monochrome or slight grey
    danger: "bg-black border-gray-500 text-gray-300 hover:bg-white hover:text-black hover:border-white",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};