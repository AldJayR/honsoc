export const STORAGE_KEYS = {
	REGISTRATION: "honsoc_registration",
} as const;

export const API_BASE_URL = "http://localhost:3000/api";

export const INPUT_CLASS =
	"h-9 rounded-lg border-brand-border bg-card shadow-sm focus:border-brand-primary placeholder:text-brand-muted text-base";

export const PRIMARY_BUTTON_CLASS =
	"bg-brand-primary-dark hover:bg-brand-primary-dark text-primary-foreground font-medium text-sm leading-5 tracking-normal h-8 px-3 rounded-lg flex gap-1.5 items-center justify-center border-0 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.98]";

export const BACK_BUTTON_CLASS =
	"bg-card border border-brand-primary text-brand-primary hover:bg-brand-primary-light/5 font-medium text-sm h-8 px-4 rounded-lg flex gap-1.5 items-center justify-center shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-50";

export const CONTINUE_BUTTON_CLASS =
	"bg-brand-primary-dark hover:bg-brand-primary text-primary-foreground font-medium text-sm h-8 px-4 rounded-lg flex gap-1.5 items-center justify-center border-0 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

export const FORM_CONTAINER = "w-full max-w-[512px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500";

export const PORTAL_CONTAINER = "w-full max-w-[708px] flex flex-col gap-6 items-center";
