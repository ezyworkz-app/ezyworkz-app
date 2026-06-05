"use client";
// import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

import dynamic from "next/dynamic";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { MoreDotIcon } from "@/icons";
import { useState, useEffect } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

import { formatCurrency } from "@/lib/format";
import { ArrowDownIcon, ArrowUpIcon, TrendingUp } from "lucide-react";

interface Financials {
  totalSales: number;
  totalProfitCalculated: number;
  totalPaidByCustomers: number;
  todaySales?: number;
  todayProfit?: number;
}

export default function MonthlyTarget({ financials }: { financials?: Financials }) {
  const [target, setTarget] = useState<number>(300000);
  const [isEditing, setIsEditing] = useState(false);
  const [tempTarget, setTempTarget] = useState("300000");

  /**
   * Safe hydration: Only read from localStorage after mount
   */
  useEffect(() => {
    const saved = localStorage.getItem('monthly_revenue_target');
    if (saved) {
      const val = Number(saved);
      setTarget(val);
      setTempTarget(saved);
    }
  }, []);

  const handleSave = () => {
    const val = Number(tempTarget);
    if (!isNaN(val) && val > 0) {
      setTarget(val);
      localStorage.setItem('monthly_revenue_target', val.toString());
      // Notify other components (like the Roadmap) that the target has changed
      window.dispatchEvent(new CustomEvent('revenue_target_updated'));
    }
    setIsEditing(false);
  };

  const sales = financials?.totalSales || 0;
  const progress = Math.min(Math.round((sales / target) * 100), 100);

  // Date Calculations
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(daysInMonth - currentDay + 1, 1); // Remaining days including today

  const remainingNeeded = Math.max(target - sales, 0);
  const dailyAvgNeeded = remainingNeeded / daysRemaining;

  const series = [progress];
  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5, // margin is in pixels
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            show: true,
            fontSize: "36px",
            fontWeight: "900",
            offsetY: -40,
            color: "#465FFF",
            formatter: function (val) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#465FFF"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progress"],
  };

  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm dark:border-blue-500/20 dark:from-blue-900/20 dark:to-gray-900 transition-all duration-300">
      <div className="px-5 pt-8 bg-white/40 shadow-inner rounded-3xl pb-11 dark:bg-gray-900/40 sm:px-6 sm:pt-10">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              Dynamic Goal Tracker
            </h3>
            <p className="mt-1 text-xs font-medium text-gray-400 uppercase tracking-widest">
              Revenue Target & Paceline
            </p>
          </div>
          <div className="relative inline-block">
            <button onClick={toggleDropdown} className="p-2 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
            </button>
            <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
              <DropdownItem onItemClick={closeDropdown} className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100">
                View Reports
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
        <div className="relative mt-2">
          <div className="max-h-[300px] flex justify-center">
            <ReactApexChart
              options={{
                ...options,
                fill: {
                  type: 'gradient',
                  gradient: {
                    shade: 'dark',
                    type: 'horizontal',
                    shadeIntensity: 0.5,
                    gradientToColors: ['#465FFF'],
                    inverseColors: true,
                    opacityFrom: 1,
                    opacityTo: 1,
                    stops: [0, 100]
                  }
                }
              }}
              series={series}
              type="radialBar"
              height={300}
            />
          </div>

          <div className="absolute left-1/2 top-[75%] -translate-x-1/2 flex flex-col items-center gap-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                {daysRemaining} Days Left
            </p>
          </div>
        </div>
        <p className="mx-auto mt-12 w-full max-w-[340px] text-center text-sm font-medium text-gray-400 leading-relaxed">
          {progress >= 100 ? (
            <span>🎉 <span className="font-black text-emerald-600">Goal achieved!</span> You have surpassed your target. Everything from here is extra growth.</span>
          ) : (
            <span>You need <span className="font-black text-brand-600 underline underline-offset-4 decoration-brand-200">{formatCurrency(dailyAvgNeeded)}</span> every day for the next <span className="text-gray-600 font-bold dark:text-white">{daysRemaining} days</span> to reach your goal.</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 dark:divide-gray-800 border-t border-gray-100 dark:border-gray-800">
        {/* Target - Clickable */}
        <div className="p-4 sm:p-6 text-center cursor-pointer group" onClick={() => !isEditing && setIsEditing(true)}>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 group-hover:text-brand-500 transition-colors">Target Goal</p>
          <div className="flex items-center justify-center gap-1 min-h-[28px]">
            {isEditing ? (
              <input
                autoFocus
                type="number"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="w-full max-w-[120px] text-center bg-brand-50 rounded border border-brand-200 font-black text-lg text-brand-700 outline-none"
              />
            ) : (
              <>
                <span className="text-lg font-black text-gray-900 dark:text-white transition-transform group-hover:scale-110">{formatCurrency(target)}</span>
                <ArrowUpIcon className="text-brand-400 size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </div>
        </div>

        {/* Current Revenue */}
        <div className="p-4 sm:p-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Revenue</p>
          <div className="flex items-center justify-center gap-1">
             <span className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(sales)}</span>
             <ArrowUpIcon className="text-emerald-500 size-3" />
          </div>
        </div>

        {/* Daily Profit Today */}
        <div className="p-4 sm:p-6 text-center border-t-0 border-l-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Today Profit</p>
          <div className="flex items-center justify-center gap-1">
             <span className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(financials?.todayProfit || 0)}</span>
             <ArrowUpIcon className="text-emerald-500 size-3" />
          </div>
        </div>

        {/* Required Daily Average */}
        <div className="p-4 sm:p-6 text-center border-t-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-600/70 mb-1">Daily Avg Required</p>
          <div className="flex items-center justify-center gap-1">
             <span className="text-lg font-black text-brand-700 dark:text-brand-400">
                {progress >= 100 ? "MET" : formatCurrency(dailyAvgNeeded)}
             </span>
             <TrendingUp className="text-brand-500 size-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
