import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { useAuthStore } from "@/stores/auth";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { oauthStatus, oauthMessage, isAuthenticated, clearOAuthStatus } =
    useAuthStore();

  // Close dialog on successful authentication
  useEffect(() => {
    if (isAuthenticated && oauthStatus === "success") {
      const timer = setTimeout(() => {
        onOpenChange(false);
        clearOAuthStatus();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, oauthStatus, onOpenChange, clearOAuthStatus]);

  // Clear OAuth status when dialog closes
  useEffect(() => {
    if (!open) {
      clearOAuthStatus();
    }
  }, [open, clearOAuthStatus]);

  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to LepakMasjid</DialogTitle>
          <DialogDescription>
            Sign in to contribute mosque information or manage your submissions.
          </DialogDescription>
        </DialogHeader>

        {/* OAuth Status Banner - Accessible and persistent */}
        {oauthStatus !== "idle" && oauthMessage && (
          <Alert
            variant={oauthStatus === "error" ? "destructive" : "default"}
            role="status"
            aria-live={oauthStatus === "loading" ? "polite" : "assertive"}
            aria-atomic="true"
            className="relative"
          >
            <div className="flex items-start gap-3">
              {oauthStatus === "loading" && (
                <div
                  className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent mt-0.5"
                  aria-hidden="true"
                />
              )}
              {oauthStatus === "success" && (
                <CheckCircle2 className="h-5 w-5 mt-0.5" aria-hidden="true" />
              )}
              {oauthStatus === "error" && (
                <AlertCircle className="h-5 w-5 mt-0.5" aria-hidden="true" />
              )}
              <AlertDescription className="flex-1 pr-6">
                {oauthMessage}
              </AlertDescription>
              {oauthStatus !== "loading" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6"
                  onClick={clearOAuthStatus}
                  aria-label="Dismiss message"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "login" | "register")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <GoogleAuthButton className="w-full" />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setActiveTab("register")}
            />
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <GoogleAuthButton className="w-full" />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setActiveTab("login")}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
