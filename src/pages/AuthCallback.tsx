import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { pb } from "@/lib/pocketbase";
import { useAuthStore } from "@/stores/auth";
import { getPocketBaseUrl } from "@/lib/pocketbase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * AuthCallback page - handles OAuth2 redirect flow (fallback method)
 *
 * This page is used when the popup method fails or is not available.
 * It handles the redirect from Google OAuth2 after user authentication.
 *
 * Note: The recommended method is using authWithOAuth2() with popup (see stores/auth.ts),
 * but this page serves as a fallback for cases where popups are blocked.
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>(
    "Completing authentication..."
  );

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus("loading");
        setMessage("Completing authentication...");

        // Get the authorization code and state from URL params
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        if (!code) {
          throw new Error("No authorization code received");
        }

        // Get the stored provider data from localStorage (set during OAuth initiation)
        const storedProvider = localStorage.getItem("pb_oauth_provider");
        if (!storedProvider) {
          throw new Error("OAuth session not found. Please try again.");
        }

        const providerData = JSON.parse(storedProvider);

        // Verify state parameter to prevent CSRF attacks
        if (providerData.state !== state) {
          throw new Error("Invalid OAuth state. Please try again.");
        }

        // Get PocketBase URL for redirect
        const pbUrl = getPocketBaseUrl();
        const redirectUrl = `${pbUrl}/api/oauth2-redirect`;

        // Exchange authorization code for auth token
        const authData = await pb
          .collection("users")
          .authWithOAuth2Code(
            "google",
            code,
            providerData.codeVerifier,
            redirectUrl
          );

        if (authData) {
          // Clear stored provider data
          localStorage.removeItem("pb_oauth_provider");
          setStatus("success");
          setMessage("Successfully signed in with Google!");
          checkAuth();

          // Redirect after showing success message
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
      } catch (error: unknown) {
        console.error("OAuth callback error:", error);
        // Clear stored provider data on error
        localStorage.removeItem("pb_oauth_provider");
        setStatus("error");
        setMessage(error.message || "Authentication failed. Please try again.");
      }
    };

    handleCallback();
  }, [searchParams, navigate, checkAuth]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-4">
        <Alert
          role="status"
          aria-live="assertive"
          aria-atomic="true"
          variant={status === "error" ? "destructive" : "default"}
          className="relative"
        >
          <div className="flex items-start gap-3">
            {status === "loading" && (
              <Loader2
                className="h-5 w-5 mt-0.5 animate-spin"
                aria-hidden="true"
              />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-5 w-5 mt-0.5" aria-hidden="true" />
            )}
            {status === "error" && (
              <AlertCircle className="h-5 w-5 mt-0.5" aria-hidden="true" />
            )}
            <div className="flex-1">
              <AlertTitle>
                {status === "loading" && "Signing you in"}
                {status === "success" && "Successfully signed in"}
                {status === "error" && "Sign in failed"}
              </AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </div>
          </div>
        </Alert>

        {status === "error" && (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => navigate("/")}>
              Go to Home
            </Button>
            <Button
              onClick={() => {
                // Retry by going back to login
                navigate("/");
                // Trigger auth dialog to open (you may need to pass this via URL params or state)
              }}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
