import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
    const navigate = useNavigate();

    // In a real app, we might check if can go back, 
    // but React Router's -1 is usually fine.

    const handleBack = () => {
        if (window.location.pathname === "/dashboard") {
            if (window.confirm("Are you sure you want to exit Inertia?")) {
                // In a browser, we can't always close the window, 
                // so we redirect to intro or logout as fallback
                window.location.href = "/";
            }
        } else {
            navigate(-1);
        }
    };

    return (
        <button
            onClick={handleBack}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95"
            title="Go Back"
        >
            <ArrowLeft size={20} />
        </button>
    );
}
