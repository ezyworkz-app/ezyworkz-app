"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

import { formatCurrency } from "@/lib/format";

interface YearlySales {
  month: string;
  sales: number;
}

export default function MonthlySalesChart({ yearlySales }: { yearlySales?: YearlySales[] }) {
  const categories = yearlySales?.map(d => d.month) || [];
  const salesData = yearlySales?.map(d => d.sales) || [];

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
      labels: {
        formatter: (val: number) => {
          if (val >= 1000) return `${(val / 1000).toFixed(2)}K`;
          return val.toString();
        },
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
  };

  const series = [
    {
      name: "Sales",
      data: salesData,
    },
  ];

  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white px-5 pt-8 shadow-sm dark:border-brand-500/20 dark:from-brand-900/20 dark:to-gray-900 sm:px-6 sm:pt-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white">
            Monthly Sales
          </h3>
          <p className="mt-1 text-xs font-medium text-gray-400 uppercase tracking-widest">
            Year-to-Date Growth
          </p>
        </div>

        <div className="relative inline-block">
          <button onClick={toggleDropdown} className="p-2 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100"
            >
              View Full Report
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full mt-6 overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <ReactApexChart
            options={{
              ...options,
              fill: {
                type: 'gradient',
                gradient: {
                  shade: 'light',
                  type: "vertical",
                  shadeIntensity: 0.25,
                  gradientToColors: undefined,
                  inverseColors: true,
                  opacityFrom: 0.85,
                  opacityTo: 0.55,
                  stops: [0, 90, 100]
                }
              }
            }}
            series={series}
            type="bar"
            height={200}
          />
        </div>
      </div>
    </div>
  );
}
