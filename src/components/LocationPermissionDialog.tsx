import { useState } from "react";
import { MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";

const LOCATION_DIALOG_DISMISSED_KEY = "location-dialog-dismissed";

interface LocationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
}

export const LocationPermissionDialog = ({
  open,
  onOpenChange,
  onAccept,
  onDecline,
}: LocationPermissionDialogProps) => {
  const { t } = useTranslation();
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  const handleAccept = () => {
    // Always save that user accepted, so we don't show dialog again if they grant permission
    localStorage.setItem(LOCATION_DIALOG_DISMISSED_KEY, "accepted");
    onAccept();
    onOpenChange(false);
  };

  const handleDecline = () => {
    if (neverShowAgain) {
      localStorage.setItem(LOCATION_DIALOG_DISMISSED_KEY, "declined");
    }
    onDecline();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            {t("location.dialog_title")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("location.dialog_description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>{t("location.dialog_benefits")}</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>{t("location.benefit_distance")}</li>
              <li>{t("location.benefit_nearby")}</li>
              <li>{t("location.benefit_map")}</li>
            </ul>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="never-show"
              checked={neverShowAgain}
              onCheckedChange={(checked) => setNeverShowAgain(checked === true)}
            />
            <Label
              htmlFor="never-show"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              {t("location.never_show_again")}
            </Label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDecline} className="w-full sm:w-auto">
            {t("location.decline")}
          </Button>
          <Button onClick={handleAccept} className="w-full sm:w-auto">
            {t("location.accept")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to check if dialog should be shown
export const shouldShowLocationDialog = (): boolean => {
  // Don't show if user dismissed the dialog
  const dismissed = localStorage.getItem(LOCATION_DIALOG_DISMISSED_KEY);
  if (dismissed) return false;

  // Don't show if user already has location stored (from previous session)
  const storedLocation = sessionStorage.getItem("nearme-location");
  if (storedLocation) {
    try {
      const parsed = JSON.parse(storedLocation);
      // Check if location is not expired (10 minutes)
      if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
        return false;
      }
    } catch {
      // Ignore parse errors
    }
  }

  return true;
};

// Helper function to reset the dialog preference
export const resetLocationDialogPreference = () => {
  localStorage.removeItem(LOCATION_DIALOG_DISMISSED_KEY);
};

export default LocationPermissionDialog;
