import { twMerge } from "tailwind-merge";

export default function Card({ children, className, onClick }) {
    return (
        <div
            onClick={onClick}
            className={twMerge(
                "bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm transition-all",
                onClick && "cursor-pointer hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700",
                className
            )}
        >
            {children}
        </div>
    );
}
