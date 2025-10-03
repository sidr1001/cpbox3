import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Plus, 
  Search, 
  Settings, 
  Users, 
  BarChart3,
  Image,
  MessageSquare,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultIcons = {
  posts: <FileText className="w-12 h-12 text-muted-foreground" />,
  create: <Plus className="w-12 h-12 text-muted-foreground" />,
  search: <Search className="w-12 h-12 text-muted-foreground" />,
  settings: <Settings className="w-12 h-12 text-muted-foreground" />,
  users: <Users className="w-12 h-12 text-muted-foreground" />,
  analytics: <BarChart3 className="w-12 h-12 text-muted-foreground" />,
  media: <Image className="w-12 h-12 text-muted-foreground" />,
  messages: <MessageSquare className="w-12 h-12 text-muted-foreground" />,
  calendar: <Calendar className="w-12 h-12 text-muted-foreground" />,
  error: <AlertCircle className="w-12 h-12 text-destructive" />,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('bg-gradient-card border-border', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-6">
          {icon || defaultIcons.posts}
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              className="shadow-button"
            >
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Предустановленные состояния
export function EmptyPostsState({ onCreatePost }: { onCreatePost: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.posts}
      title="Пока нет постов"
      description="Создайте свой первый пост для публикации в социальных сетях"
      action={{
        label: "Создать пост",
        onClick: onCreatePost,
      }}
    />
  );
}

export function EmptySearchState({ onClearSearch }: { onClearSearch: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.search}
      title="Ничего не найдено"
      description="Попробуйте изменить поисковый запрос или очистить фильтры"
      action={{
        label: "Очистить поиск",
        onClick: onClearSearch,
        variant: "outline",
      }}
    />
  );
}

export function EmptyMediaState({ onUploadMedia }: { onUploadMedia: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.media}
      title="Нет медиафайлов"
      description="Добавьте изображения или видео для вашего поста"
      action={{
        label: "Загрузить медиа",
        onClick: onUploadMedia,
      }}
    />
  );
}

export function EmptyAnalyticsState({ onViewPosts }: { onViewPosts: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.analytics}
      title="Нет данных для анализа"
      description="Создайте и опубликуйте посты, чтобы увидеть статистику"
      action={{
        label: "Посмотреть посты",
        onClick: onViewPosts,
      }}
    />
  );
}

export function EmptyScheduledState({ onSchedulePost }: { onSchedulePost: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.calendar}
      title="Нет запланированных постов"
      description="Запланируйте публикацию постов на удобное время"
      action={{
        label: "Запланировать пост",
        onClick: onSchedulePost,
      }}
    />
  );
}

export function EmptyErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.error}
      title="Произошла ошибка"
      description="Не удалось загрузить данные. Проверьте подключение к интернету"
      action={{
        label: "Попробовать снова",
        onClick: onRetry,
        variant: "outline",
      }}
    />
  );
}

// Хук для управления пустыми состояниями
export function useEmptyState() {
  const [state, setState] = React.useState<{
    type: keyof typeof defaultIcons;
    title: string;
    description: string;
    action?: EmptyStateProps['action'];
    secondaryAction?: EmptyStateProps['secondaryAction'];
  } | null>(null);

  const showEmptyState = React.useCallback((config: NonNullable<typeof state>) => {
    setState(config);
  }, []);

  const hideEmptyState = React.useCallback(() => {
    setState(null);
  }, []);

  const EmptyStateComponent = React.useMemo(() => {
    if (!state) return null;

    return (
      <EmptyState
        icon={defaultIcons[state.type]}
        title={state.title}
        description={state.description}
        action={state.action}
        secondaryAction={state.secondaryAction}
      />
    );
  }, [state]);

  return {
    showEmptyState,
    hideEmptyState,
    EmptyStateComponent,
    isEmpty: state !== null,
  };
}