import { forwardRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Eye, EyeOff } from "lucide-react";

const Input = forwardRef(({ className, error, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    return (
        <div className="w-full">
            <div className="relative group">
                <input
                    ref={ref}
                    type={isPassword ? (showPassword ? "text" : "password") : type}
                    className={twMerge(
                        "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 transition-colors",
                        isPassword && "pr-10",
                        className
                    )}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
});

Input.displayName = "Input";
export default Input;
