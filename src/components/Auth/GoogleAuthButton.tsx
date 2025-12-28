import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Chrome, Loader2 } from "lucide-react";

interface GoogleAuthButtonProps {
  className?: string;
}

export const GoogleAuthButton = ({ className }: GoogleAuthButtonProps) => {
  const { loginWithGoogle, oauthStatus } = useAuthStore();
  const isLoading = oauthStatus === "loading";

  const handleClick = () => {
    // Don't use async/await here to avoid popup blocking on Safari
    loginWithGoogle().catch((error) => {
      // Error is already handled in the store and displayed via status message
      console.error("Google OAuth error:", error);
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      aria-busy={isLoading}
      aria-live="polite"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Signing in...
        </>
      ) : (
        <>
          <Chrome className="mr-2 h-4 w-4" aria-hidden="true" />
          Continue with Google
        </>
      )}
    </Button>
  );
};
