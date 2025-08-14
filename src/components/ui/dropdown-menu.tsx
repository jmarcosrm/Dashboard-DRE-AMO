import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, className }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <div className={cn('relative inline-block text-left', className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            ...child.props, 
            isOpen, 
            setIsOpen 
          } as any);
        }
        return child;
      })}
    </div>
  );
};

const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps & { isOpen?: boolean; setIsOpen?: (open: boolean) => void }> = ({ 
  children, 
  className, 
  onClick, 
  isOpen, 
  setIsOpen 
}) => {
  const handleClick = () => {
    setIsOpen?.(!isOpen);
    onClick?.();
  };
  
  return (
    <button
      type="button"
      className={cn(
        'inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50',
        className
      )}
      onClick={handleClick}
    >
      {children}
      <ChevronDown className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
    </button>
  );
};

const DropdownMenuContent: React.FC<DropdownMenuContentProps & { isOpen?: boolean; setIsOpen?: (open: boolean) => void }> = ({ 
  children, 
  className, 
  align = 'start', 
  isOpen, 
  setIsOpen 
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen?.(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);
  
  if (!isOpen) return null;
  
  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0'
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
        alignmentClasses[align],
        className
      )}
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  );
};

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  className, 
  onClick, 
  disabled = false 
}) => {
  return (
    <button
      type="button"
      className={cn(
        'block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ className }) => {
  return (
    <div className={cn('my-1 h-px bg-gray-200', className)} />
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};