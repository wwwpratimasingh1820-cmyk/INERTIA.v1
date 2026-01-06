import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 pt-24 pb-12 w-full">
                <Outlet />
            </main>
        </div>
    );
}
