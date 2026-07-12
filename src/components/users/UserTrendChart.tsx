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
      height: 350,
      toolbar: {
        show: true,
        tools: { zoom: false, pan: false, reset: false, download: true },
      },
      zoom: { enabled: false },
      dropShadow: {
          enabled: true,
          color: color,
          top: 8,
          left: 0,
          blur: 6,
          opacity: 0.15
      }
    },
    stroke: {
      curve: "smooth",
      width: [3, 2],
      dashArray: [0, 5], // Solid for current, dashed for previous
    },
    fill: {
      type: ["gradient", "solid"],
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.0,
        stops: [0, 100],
      },
    },
    markers: {
      size: [4, 0],
      colors: ["#fff"],
      strokeColors: [color],
      strokeWidth: 2,
      hover: {
        size: 6,
      }
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#9CA3AF", fontSize: "12px", fontWeight: 500 },
      },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#9CA3AF", fontSize: "12px", fontWeight: 500 },
      },
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 0, bottom: 0, left: 10 },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontFamily: "Outfit",
      fontWeight: 600,
      markers: { strokeWidth: 0, size: 6 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (val: number) => `${val}` },
      theme: "light",
      style: {
          fontSize: '12px',
          fontFamily: 'Outfit, sans-serif'
      }
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
