import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  PenTool, 
  History, 
  Settings,
  Zap,
  Menu,
  X,
  LogOut,
  User,
  Wallet,
  ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserBalance } from "@/hooks/useUserBalance";
import { useUserRole } from "@/hooks/useUserRole";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useToast } from "@/hooks/use-toast";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const { balance } = useUserBalance();
  const { isSuperAdmin, isAdmin } = useUserRole();
  const { settings } = useSiteSettings();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-main">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!loading && !user) {
    // Only redirect after loading is complete
    // Save current hash if it contains VK OAuth params before redirecting
    const hash = window.location.hash;
    if (hash.includes('vk_success') || hash.includes('vk_error')) {
      sessionStorage.setItem('vk_oauth_redirect', window.location.pathname + hash);
    }
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Выход выполнен",
      description: "До свидания!",
    });
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { to: "/", label: "Дашборд", icon: LayoutDashboard },
    { to: "/create", label: "Создать пост", icon: PenTool },
    { to: "/history", label: "История", icon: History },
    ...(isSuperAdmin ? [] : [{ to: "/payment", label: "Пополнить баланс", icon: Wallet }]),
    { to: "/settings", label: "Настройки", icon: Settings },
  ];

  if (isSuperAdmin) {
    navItems.push({ to: "/admin", label: "Админ панель", icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen bg-gradient-main">
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-0 left-0 w-64 h-full bg-card border-r border-border">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {settings.site_name}
                </h1>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <nav className="px-4 space-y-2">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}>
                  <Button 
                    variant={isActive(item.to) ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-background/50 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.user_metadata?.display_name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Баланс: {balance.toFixed(2)}₽
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="h-8 w-8 p-0"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {settings.site_name}
            </h1>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}>
                <Button 
                  variant={isActive(item.to) ? "default" : "ghost"}
                  className="flex items-center space-x-2"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center space-x-3">
            {!isSuperAdmin && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-md">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{balance.toFixed(2)}₽</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{user.user_metadata?.display_name || user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;