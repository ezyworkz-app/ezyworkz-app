"use client";
import React from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface TopServicesChartProps {
  data: Record<string, number>;
}

export const TopServicesChart: React.FC<TopServicesChartProps> = ({ data }) => {
  const series = [
    {
      name: "Services",
      data: Object.values(data),
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      fontFamily: "Outfit, sans-serif",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
        barHeight: "50%",
        distributed: true,
      },
    },
    colors: ["#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a"],
    dataLabels: {
      enabled: true,
      textAnchor: "start",
      style: {
        colors: ["#fff"],
      },
      formatter: function (val, opt) {
        return opt.w.globals.labels[opt.dataPointIndex] + ":  " + val;
      },
      offsetX: 0,
    },
    legend: {
      show: false,
    },
    xaxis: {
      categories: Object.keys(data),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        show: false,
      },
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true,
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} Services`,
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/50">
      <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-6 uppercase tracking-wider">Top Services by Volume</h4>
      <div className="h-[350px]">
        <ReactApexChart options={options} series={series} type="bar" height="100%" />
      </div>
    </div>
  );
};
