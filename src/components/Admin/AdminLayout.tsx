import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  FileSearch,
  Menu,
  ArrowLeft,
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useSubmissions } from "@/hooks/use-submissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { data: pendingSubmissions = [] } = useSubmissions("pending");
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: t("admin.dashboard") },
    {
      path: "/admin/submissions",
      icon: FileText,
      label: t("admin.submissions"),
      badge:
        pendingSubmissions.length > 0 ? pendingSubmissions.length : undefined,
    },
    { path: "/admin/mosques", icon: Building2, label: t("admin.mosques") },
    { path: "/admin/users", icon: Users, label: t("admin.users") },
    { path: "/admin/audit", icon: FileSearch, label: t("admin.audit_log") },
  ];

  const NavContent = () => (
    <nav className="space-y-2">
      <Link
        to="/"
        onClick={() => isMobile && setSidebarOpen(false)}
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors mb-4",
          "text-muted-foreground hover:bg-secondary hover:text-foreground border-b border-border pb-4"
        )}
      >
        <ArrowLeft className="h-5 w-5" />
        <span>{t("common.back_to_home") || "Back to Home"}</span>
      </Link>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => isMobile && setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/20 text-xs">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 border-r border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold mb-6">
            {t("admin.panel")}
          </h2>
          <NavContent />
        </aside>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-6">
            <h2 className="font-display text-xl font-bold mb-6">
              {t("admin.panel")}
            </h2>
            <NavContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          {isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4 mr-2" />
              {t("admin.panel")}
            </Button>
          )}
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("common.back_to_home") || "Back to Home"}
            </Button>
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
};
