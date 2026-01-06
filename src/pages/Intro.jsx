import { Link } from "react-router-dom";
import { ArrowRight, LayoutGrid } from "lucide-react";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";

export default function Intro() {
    const { setHasVisited } = useApp();

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 transition-colors">
            <div className="max-w-md w-full text-center space-y-12 flex flex-col items-center">
                <div className="p-5 bg-zinc-900 dark:bg-white rounded-3xl shadow-2xl">
                    <LayoutGrid className="w-12 h-12 text-white dark:text-zinc-900" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Inertia
                    </h1>
                    <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-[280px] mx-auto">
                        Plan your next big idea. Calm and distraction-free.
                    </p>
                </div>

                <div>
                    <Link to="/dashboard" onClick={() => setHasVisited(true)}>
                        <Button size="lg" className="rounded-full px-10 h-14 text-lg group shadow-lg shadow-zinc-200 dark:shadow-none">
                            Get Started
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>

                <p className="absolute bottom-12 left-0 right-0 text-center text-xs text-zinc-400 dark:text-zinc-600">
                    Data stored locally on your device.
                </p>
            </div>
        </div>
    );
}
