import { useState } from "react";
import { Sliders, AlertCircle, TrendingDown, TrendingUp, Info } from "lucide-react";
import Button from "./Button";
import Card from "./Card";
import clsx from "clsx";

export default function WhatIfSimulator({ initialDays, initialCost, initialMembers }) {
    const [daysDelta, setDaysDelta] = useState(0);
    const [costDelta, setCostDelta] = useState(0);
    const [membersDelta, setMembersDelta] = useState(0);

    const newDays = Math.max(1, initialDays + Number(daysDelta));
    const newCost = Math.max(0, initialCost + Number(costDelta));
    const newMembers = Math.max(1, initialMembers + Number(membersDelta));

    // Risk Calculation
    const getRisk = () => {
        let riskScore = 0;
        // Cost spike?
        if (costDelta > initialCost * 0.3) riskScore += 2;
        // Member reduction while days increase/high cost?
        if (membersDelta < 0 && (daysDelta < 0 || costDelta > 0)) riskScore += 3;
        // Aggressive deadline (days reduction)
        if (daysDelta < -(initialDays * 0.2)) riskScore += 2;

        if (riskScore >= 4) return { label: "High Risk", color: "bg-red-100 text-red-600 border-red-200" };
        if (riskScore >= 2) return { label: "Medium Risk", color: "bg-amber-100 text-amber-600 border-amber-200" };
        return { label: "Low Risk", color: "bg-emerald-100 text-emerald-600 border-emerald-200" };
    };

    const risk = getRisk();

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
                <Sliders size={18} />
                <h3 className="font-bold uppercase tracking-wider text-xs">Sandbox Simulator</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sliders */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase text-zinc-400">
                            <span>Timeline Adjustment</span>
                            <span className={clsx(daysDelta > 0 ? "text-blue-500" : "text-amber-500")}>
                                {daysDelta >= 0 ? "+" : ""}{daysDelta} Days
                            </span>
                        </div>
                        <input
                            type="range" min={-10} max={30} step={1}
                            value={daysDelta} onChange={(e) => setDaysDelta(Number(e.target.value))}
                            className="w-full accent-zinc-900 dark:accent-white h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase text-zinc-400">
                            <span>Budget Modification</span>
                            <span className={clsx(costDelta > 0 ? "text-red-500" : "text-emerald-500")}>
                                {costDelta >= 0 ? "+" : ""}${costDelta}
                            </span>
                        </div>
                        <input
                            type="range" min={-Math.min(1000, initialCost)} max={5000} step={100}
                            value={costDelta} onChange={(e) => setCostDelta(Number(e.target.value))}
                            className="w-full accent-zinc-900 dark:accent-white h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase text-zinc-400">
                            <span>Team Scaling</span>
                            <span className={clsx(membersDelta > 0 ? "text-emerald-500" : "text-red-500")}>
                                {membersDelta >= 0 ? "+" : ""}{membersDelta} People
                            </span>
                        </div>
                        <input
                            type="range" min={-Math.max(0, initialMembers - 1)} max={10} step={1}
                            value={membersDelta} onChange={(e) => setMembersDelta(Number(e.target.value))}
                            className="w-full accent-zinc-900 dark:accent-white h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                {/* Forecast Card */}
                <Card className="bg-zinc-50 dark:bg-zinc-800/50 border-none p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-400 uppercase">Scenario Forecast</span>
                        <div className={clsx("px-2 py-1 rounded-md text-[10px] font-black uppercase border", risk.color)}>
                            {risk.label}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-sm text-zinc-500">Days Needed</span>
                            <span className="text-xl font-bold">{newDays}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-sm text-zinc-500">Project Cost</span>
                            <span className="text-xl font-bold">${newCost}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-sm text-zinc-500">Workload / Person</span>
                            <span className="text-xl font-bold">{Math.round((newDays / newMembers) * 10) / 10}d</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-start gap-2">
                        <Info size={14} className="text-zinc-400 mt-1 shrink-0" />
                        <p className="text-[10px] text-zinc-500 leading-tight">
                            This is a <strong>Preview Only</strong> environment. Changes made here will not affect your actual project data unless confirmed.
                        </p>
                    </div>
                </Card>
            </div>

            <div className="flex justify-end pt-2">
                <Button variant="ghost" onClick={() => { setDaysDelta(0); setCostDelta(0); setMembersDelta(0); }} className="text-xs p-0">Reset Simulator</Button>
            </div>
        </div>
    );
}
