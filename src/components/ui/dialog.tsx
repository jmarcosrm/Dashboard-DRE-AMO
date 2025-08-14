import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

interface DialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

export const Dialog: React.FC<DialogProps> = ({ open = false, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = React.useState(open);
  
  const isOpen = onOpenChange ? open : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: setOpen }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const DialogTrigger: React.FC<DialogTriggerProps> = ({ children, onClick }) => {
  const context = React.useContext(DialogContext);
  
  const handleClick = () => {
    onClick?.();
    context?.onOpenChange(true);
  };

  if (React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as any);
  }

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  );
};

export const DialogContent: React.FC<DialogContentProps> = ({ className, children, onClose }) => {
  const context = React.useContext(DialogContext);
  
  if (!context?.open) return null;

  const handleClose = () => {
    onClose?.();
    context.onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={handleClose}
      />
      <div
        className={cn(
          'relative z-50 w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </button>
        {children}
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<DialogHeaderProps> = ({ className, children }) => {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}>
      {children}
    </div>
  );
};

export const DialogTitle: React.FC<DialogTitleProps> = ({ className, children }) => {
  return (
    <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h3>
  );
};

export const DialogDescription: React.FC<DialogDescriptionProps> = ({ className, children }) => {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  );
};

export const DialogFooter: React.FC<DialogFooterProps> = ({ className, children }) => {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>
      {children}
    </div>
  );
};