"use client";
import React, { useMemo } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { ShopSettlement } from "@/types/shop-settlement";
import { format, startOfMonth, startOfWeek, parseISO, subMonths, isAfter, eachMonthOfInterval, eachWeekOfInterval, endOfMonth, endOfWeek } from "date-fns";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ShopFinanceTrendChartProps {
  settlements: ShopSettlement[];
  timeframe: "monthly" | "weekly";
}

export default function ShopFinanceTrendChart({
  settlements,
  timeframe,
}: ShopFinanceTrendChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const intervalStart = timeframe === "monthly" ? subMonths(now, 6) : subMonths(now, 2); // 6 months or ~8 weeks
    
    // Generate categories (date labels)
    let intervals: Date[] = [];
    if (timeframe === "monthly") {
      intervals = eachMonthOfInterval({ start: intervalStart, end: now });
    } else {
      intervals = eachWeekOfInterval({ start: intervalStart, end: now });
    }

    const categories = intervals.map(d => {
      if (timeframe === "monthly") {
        return format(d, "MMM yyyy");
      } else {
        const start = format(d, "MMM d");
        const endDate = endOfWeek(d);
        const startMonth = format(d, "MMM");
        const endMonth = format(endDate, "MMM");
        
        if (startMonth !== endMonth) {
          return `${start}-${endMonth} ${format(endDate, "d")}`;
        }
        return `${start}-${format(endDate, "d")}`;
      }
    });

    const grossData = new Array(intervals.length).fill(0);
    const bonusData = new Array(intervals.length).fill(0);
    const netData = new Array(intervals.length).fill(0);
    const logisticsData = new Array(intervals.length).fill(0);

    settlements.forEach(s => {
      const date = parseISO(s.settledAt || s.createdAt);
      if (isAfter(date, intervalStart)) {
        let index = -1;
        if (timeframe === "monthly") {
          const start = startOfMonth(date).getTime();
          index = intervals.findIndex(d => startOfMonth(d).getTime() === start);
        } else {
          const start = startOfWeek(date).getTime();
          index = intervals.findIndex(d => startOfWeek(d).getTime() === start);
        }

        if (index !== -1) {
          grossData[index] += s.shopGrossAmount || 0;
          bonusData[index] += s.shopPriorityAmount || 0;
          netData[index] += s.shopTotalAmount || 0;
          logisticsData[index] += s.shopLogisticsCost || 0;
        }
      }
    });

    return {
      categories,
      series: [
        { name: "Gross Revenue", data: grossData.map(v => Math.round(v)) },
        { name: "Priority Bonuses", data: bonusData.map(v => Math.round(v)) },
        { name: "Net Payout", data: netData.map(v => Math.round(v)) },
        { name: "Logistics Fees", data: logisticsData.map(v => Math.round(v)) },
      ]
    };
  }, [settlements, timeframe]);

  const formatK = (val: number) => {
    if (val >= 1000) {
      return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
    }
    return `₹${val.toLocaleString()}`;
  };

  const options: ApexOptions = {
    colors: ["#826CBB", "#6366f1", "#12b76a", "#36bffa"], 
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 350,
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent',
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: chartData.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#9CA3AF",
          fontSize: "12px",
          fontWeight: 600,
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatK(val),
        style: {
          colors: "#9CA3AF",
          fontSize: "12px",
          fontWeight: 600,
        },
      },
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 5,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontFamily: "Outfit",
      fontWeight: 600,
      fontSize: "12px",
      markers: {
        strokeWidth: 0,
        offsetX: -4,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
    },
    tooltip: {
      x: { show: true },
      y: {
        formatter: (val: number) => formatK(val),
        title: {
          formatter: (seriesName) => `${seriesName}:`,
        },
      },
      theme: 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'Outfit',
      },
    },
    markers: {
      size: 4,
      strokeWidth: 2,
      strokeColors: "#fff",
      hover: {
        size: 7,
      }
    }
  };

  return (
    <div className="w-full">
      <ReactApexChart
        options={options}
        series={chartData.series}
        type="area"
        height={350}
      />
    </div>
  );
}
