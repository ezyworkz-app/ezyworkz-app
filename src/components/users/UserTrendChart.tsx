"use client";
import React from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface UserTrendChartProps {
  title: string;
  categories: string[];
  currentSeries: number[];
  previousSeries: number[];
  currentLabel?: string;
  previousLabel?: string;
  color?: string;
}

export const UserTrendChart: React.FC<UserTrendChartProps> = ({
  title,
  categories,
  currentSeries,
  previousSeries,
  currentLabel = "Current",
  previousLabel = "Previous",
  color = "#465fff",
}) => {
  const options: ApexOptions = {
    colors: [color, "#E5E7EB"], // Brand color vs Light Gray for ghost series
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 250,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: [3, 2],
      dashArray: [0, 5], // Solid for current, dashed for previous
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: "#9CA3AF",
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#9CA3AF",
          fontSize: "12px",
        },
      },
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontFamily: "Outfit",
      markers: {
        strokeWidth: 0,
      },
    },
    tooltip: {
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  };

  const series = [
    {
      name: currentLabel,
      data: currentSeries,
    },
    {
      name: previousLabel,
      data: previousSeries,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/50">
      <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-6 uppercase tracking-wider">{title}</h4>
      <div className="h-[350px] w-full">
        <ReactApexChart
          options={options}
          series={series}
          type="area"
          height={350}
        />
      </div>
    </div>
  );
};
