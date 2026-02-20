import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";

interface GoogleAuthButtonProps {
  className?: string;
}

export const GoogleAuthButton = ({ className }: GoogleAuthButtonProps) => {
  return (
    <Button
      type="button"
      variant="outline"
      disabled
      className={className}
      aria-disabled="true"
      title="Google sign-in is temporarily unavailable"
    >
      <>
        <Chrome className="mr-2 h-4 w-4" aria-hidden="true" />
        Continue with Google
      </>
    </Button>
  );
};
