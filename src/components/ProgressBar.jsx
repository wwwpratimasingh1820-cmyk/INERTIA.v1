import clsx from "clsx";

export default function ProgressBar({ value = 0, className }) {
    // Clamp value between 0 and 100
    const percentage = Math.min(100, Math.max(0, value));

    return (
        <div className={clsx("h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800", className)}>
            <div
                style={{ width: `${percentage}%` }}
                className="h-full bg-zinc-900 dark:bg-white transition-all duration-500 ease-out"
            />
        </div>
    );
}
