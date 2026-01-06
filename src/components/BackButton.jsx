import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
    const navigate = useNavigate();

    // In a real app, we might check if can go back, 
    // but React Router's -1 is usually fine.

    return (
        <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95"
            title="Go Back"
        >
            <ArrowLeft size={20} />
        </button>
    );
}
