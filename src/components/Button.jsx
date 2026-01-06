import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

const variants = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200",
    secondary: "bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
    danger: "bg-red-500 text-white hover:bg-red-600 dark:bg-red-900/50 dark:text-red-200 dark:hover:bg-red-900/80",
    ghost: "bg-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
};

const Button = forwardRef(({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={twMerge(
                clsx(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
                    variants[variant],
                    size === "sm" && "px-3 py-1.5 text-sm",
                    size === "md" && "px-4 py-2 text-base",
                    size === "lg" && "px-6 py-3 text-lg",
                    size === "icon" && "p-2"
                ),
                className
            )}
            {...props}
        />
    );
});

Button.displayName = "Button";
export default Button;
