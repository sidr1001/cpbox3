import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, LogOut, X } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  icon?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

const variantIcons = {
  default: X,
  destructive: AlertTriangle,
};

const variantColors = {
  default: 'text-muted-foreground',
  destructive: 'text-destructive',
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'default',
  icon,
  onConfirm,
  loading = false,
}: ConfirmationDialogProps) {
  const Icon = icon || variantIcons[variant];
  const colorClass = variantColors[variant];

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Confirmation action failed:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Загрузка...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Предустановленные диалоги
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Удалить элемент"
      description={`Вы уверены, что хотите удалить "${itemName}"? Это действие нельзя отменить.`}
      confirmText="Удалить"
      variant="destructive"
      icon={<Trash2 className="w-5 h-5" />}
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}

export function LogoutConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Выйти из аккаунта"
      description="Вы уверены, что хотите выйти из аккаунта? Вам потребуется войти снова для доступа к приложению."
      confirmText="Выйти"
      variant="default"
      icon={<LogOut className="w-5 h-5" />}
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}

// Хук для управления диалогами подтверждения
export function useConfirmationDialog() {
  const [open, setOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Partial<ConfirmationDialogProps>>({});

  const showDialog = React.useCallback((dialogConfig: Partial<ConfirmationDialogProps>) => {
    setConfig(dialogConfig);
    setOpen(true);
  }, []);

  const hideDialog = React.useCallback(() => {
    setOpen(false);
    setConfig({});
  }, []);

  const Dialog = React.useMemo(() => (
    <ConfirmationDialog
      open={open}
      onOpenChange={setOpen}
      title=""
      description=""
      onConfirm={() => {}}
      {...config}
    />
  ), [open, config]);

  return {
    showDialog,
    hideDialog,
    Dialog,
  };
}