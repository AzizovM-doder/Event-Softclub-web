import React from "react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  };

  const currentLang = i18n.language?.split("-")[0] || "en";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-foreground transition-colors backdrop-blur-md border border-white/10"
        >
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl border-white/10 bg-background/80 backdrop-blur-xl">
        <DropdownMenuItem onClick={() => changeLanguage("en")} className={currentLang === "en" ? "bg-accent" : ""}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("ru")} className={currentLang === "ru" ? "bg-accent" : ""}>
          Русский
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("tj")} className={currentLang === "tj" ? "bg-accent" : ""}>
          Тоҷикӣ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
