import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** OAuth callback route — Google sign-in is not wired on the API yet. */
export default function AuthCallback() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sign-in unavailable</AlertTitle>
          <AlertDescription>
            Google OAuth is not configured for this deployment. Use email and
            password to sign in.
          </AlertDescription>
        </Alert>
        <Button asChild className="w-full">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}