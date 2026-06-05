"use client";
import React from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface InfluencerTiersChartProps {
  data: Record<string, number>;
}

export const InfluencerTiersChart: React.FC<InfluencerTiersChartProps> = ({ data }) => {
  const series = [
    {
      name: "Users",
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
        horizontal: false,
        columnWidth: "40%",
        distributed: true,
      },
    },
    colors: ["#f472b6", "#ec4899", "#db2777", "#be185d"],
    dataLabels: {
      enabled: false,
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
        style: {
          colors: "#9CA3AF",
          fontSize: "10px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#9CA3AF",
          fontSize: "10px",
        },
      },
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 5,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} Users`,
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/50">
      <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-6 uppercase tracking-wider">Influencer Tiers (Referrals)</h4>
      <div className="h-[350px]">
        <ReactApexChart options={options} series={series} type="bar" height="100%" />
      </div>
    </div>
  );
};
