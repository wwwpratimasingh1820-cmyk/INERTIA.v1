import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Settings, LayoutGrid } from "lucide-react";
import BackButton from "./BackButton";
import clsx from "clsx";

export default function Navbar() {
    const location = useLocation();

    if (location.pathname === "/") return null; // Hide on intro

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <BackButton />
                    <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity">
                        <LayoutGrid className="w-5 h-5 text-zinc-900 dark:text-white" />
                        <span>Inertia</span>
                    </Link>
                </div>

                <div className="flex items-center gap-2">

                    <Link
                        to="/settings"
                        className={clsx(
                            "p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400",
                            location.pathname === "/settings" && "bg-zinc-800 text-white"
                        )}
                    >
                        <Settings size={20} />
                    </Link>
                </div>
            </div>
        </nav>
    );
}
