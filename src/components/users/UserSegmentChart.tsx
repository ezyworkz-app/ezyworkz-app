"use client";
import React from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface UserSegmentChartProps {
  data: Record<string, number>;
}

export const UserSegmentChart: React.FC<UserSegmentChartProps> = ({ data }) => {
  const series = Object.values(data);
  const labels = Object.keys(data).map(k => k.replace("_", " "));

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },
    labels: labels,
    colors: ["#465fff", "#10B981", "#F59E0B", "#EF4444"],
    legend: {
      position: "bottom",
      fontFamily: "Outfit",
    },
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Users",
              color: "#6b7280",
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString();
              },
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} Users`,
      },
    },
    stroke: {
        show: false
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/50">
      <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-6 uppercase tracking-wider">Customer Segments</h4>
      <div className="h-[350px]">
        <ReactApexChart options={options} series={series} type="donut" height="100%" />
      </div>
    </div>
  );
};
