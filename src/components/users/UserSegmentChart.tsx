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
      animations: {
          enabled: true,
          speed: 800,
          animateGradually: {
              enabled: true,
              delay: 150
          },
          dynamicAnimation: {
              enabled: true,
              speed: 350
          }
      }
    },
    labels: labels,
    colors: ["#465fff", "#10B981", "#F59E0B", "#EF4444"],
    legend: {
      position: "bottom",
      fontFamily: "Outfit",
      fontWeight: 500,
      formatter: function(seriesName, opts) {
          const val = opts.w.globals.series[opts.seriesIndex];
          return seriesName + "  -  " + val;
      }
    },
    dataLabels: {
      enabled: true,
      dropShadow: { enabled: false },
      style: {
        fontSize: '13px',
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 'bold',
      },
    },
    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: {
                show: true,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 500,
                color: '#6b7280'
            },
            value: {
                show: true,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 'bold',
                fontSize: '24px',
                color: '#1f2937',
                formatter: function (val) {
                    return val.toString();
                }
            },
            total: {
              show: true,
              label: "Total Users",
              color: "#6b7280",
              fontFamily: 'Outfit, sans-serif',
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
      theme: "light",
      style: {
          fontSize: '12px',
          fontFamily: 'Outfit, sans-serif'
      }
    },
    stroke: {
        show: true,
        colors: ['#fff'],
        width: 2
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
