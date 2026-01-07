import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function BackButton() {
    const navigate = useNavigate();

    // In a real app, we might check if can go back, 
    // but React Router's -1 is usually fine.

    const { logout } = useApp();

    const handleBack = () => {
        if (window.location.pathname === "/dashboard") {
            if (window.confirm("Are you sure you want to exit Inertia?")) {
                // Attempt to close window (works in some PWA/standalone modes)
                window.close();
                // Fallback for browsers that block window.close():
                window.location.href = "about:blank";
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
