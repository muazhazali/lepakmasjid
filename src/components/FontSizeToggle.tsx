import { Minus, Plus, RotateCcw, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFontSizeStore } from "@/stores/fontSize";
import { useTranslation } from "@/hooks/use-translation";

export const FontSizeToggle = () => {
  const { fontSize, increaseFontSize, decreaseFontSize, resetFontSize } =
    useFontSizeStore();
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("accessibility.font_size")}
        >
          <Type className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          {t("accessibility.font_size")}: {fontSize}px
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={increaseFontSize} disabled={fontSize >= 24}>
          <Plus className="mr-2 h-4 w-4" />
          {t("accessibility.increase")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={decreaseFontSize} disabled={fontSize <= 12}>
          <Minus className="mr-2 h-4 w-4" />
          {t("accessibility.decrease")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={resetFontSize}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {t("accessibility.reset")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
