"use client";
import React from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { formatCurrency } from "@/lib/format";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface FinancialData {
  date: string;
  rev_service: number;
  rev_tax: number;
  rev_delivery: number;
  rev_fees: number;
  audit_profit: number;
  audit_payouts: number;
  audit_logistics: number;
  audit_discounts: number;
  audit_compensation: number;
  audit_marketing: number;
  totalSales: number;
}

export default function DailyFinancialsChart({ 
  financialCombined, 
  title = "Daily Performance" 
}: { 
  financialCombined?: FinancialData[]; 
  title?: string;
}) {
  const categories = financialCombined?.map(d => {
    const dObj = new Date(d.date);
    return dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }) || [];

  const seriesData = {
    rev_service: financialCombined?.map(d => d.rev_service) || [],
    rev_tax: financialCombined?.map(d => d.rev_tax) || [],
    rev_delivery: financialCombined?.map(d => d.rev_delivery) || [],
    rev_fees: financialCombined?.map(d => d.rev_fees) || [],
    audit_profit: financialCombined?.map(d => d.audit_profit) || [],
    audit_payouts: financialCombined?.map(d => d.audit_payouts) || [],
    audit_logistics: financialCombined?.map(d => d.audit_logistics) || [],
    audit_discounts: financialCombined?.map(d => d.audit_discounts) || [],
    audit_compensation: financialCombined?.map(d => d.audit_compensation) || [],
    audit_marketing: financialCombined?.map(d => d.audit_marketing) || [],
  };

  const options: ApexOptions = {
    colors: [
      "#7159AB", "#826CBB", "#B7ADDE", "#D2CBEB", // Revenue (Launezy Brand Purples)
      "#039855", "#465FFF", "#F79009", "#7A5AF8", "#D92D20", "#FD4394" // Audit (Success, Blue, Warning, Purple, Error, Marketing Pink)
    ], 
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 350,
      stacked: true,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "35%",
        barGap: "25%",
        borderRadius: 0,
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last",
        dataLabels: {
          total: {
            enabled: true,
            style: {
              color: "#6B7280",
              fontSize: '10px',
              fontWeight: 600,
              fontFamily: 'Outfit'
            },
            formatter: (val: string, { w, dataPointIndex }) => {
              // Calculate total for ONLY the 'revenue' group at this index
              let revTotal = 0;
              w.config.series.forEach((s: any, i: number) => {
                if (s.group === 'revenue') {
                  revTotal += w.globals.series[i][dataPointIndex];
                }
              });
              return `₹${revTotal.toFixed(0)}`;
            }
          }
        }
      } as any,
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 0,
      colors: ["transparent"],
    },
    xaxis: {
      categories: categories,
      tickAmount: Math.min(categories.length, 12),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        hideOverlappingLabels: true,
        style: { colors: "#6B7280", fontSize: "11px" },
      },
    },
    yaxis: {
      labels: {
        style: { colors: "#6B7280", fontSize: "11px" },
        formatter: (val: number) => {
          if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
          return `₹${val}`;
        },
      },
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    fill: {
      opacity: 0.9,
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      fontWeight: 500,
      fontSize: "12px",
      markers: { size: 5 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const date = w.globals.labels[dataPointIndex];
        
        const renderGroup = (title: string, startIndex: number, count: number, isRight = false) => {
          let groupTotal = 0;
          for (let i = startIndex; i < startIndex + count; i++) {
            groupTotal += series[i][dataPointIndex];
          }

          let itemsHtml = "";
          for (let i = startIndex; i < startIndex + count; i++) {
            const val = series[i][dataPointIndex];
            const name = w.config.series[i].name;
            const color = w.config.colors[i];
            const percentage = groupTotal > 0 ? ((val / groupTotal) * 100).toFixed(1) : "0";
            
            itemsHtml += `
              <div class="flex items-center justify-between gap-3 mb-0.5">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full" style="background-color: ${color}"></span>
                  <span class="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[80px]">${name}:</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[9px] font-medium text-gray-400">${percentage}%</span>
                  <span class="font-bold text-gray-800 dark:text-gray-200" style="font-size: 10px;">${val.toFixed(0)}</span>
                </div>
              </div>
            `;
          }
          return `
            <div class="${isRight ? 'pl-3 border-l border-gray-100 dark:border-gray-800' : 'pr-3'} flex-1">
              <div class="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-tighter">${title}</div>
              ${itemsHtml}
              <div class="mt-1.5 pt-1 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span class="text-[10px] font-extrabold text-gray-400 uppercase">Total</span>
                <span class="text-[11px] font-black ${isRight ? 'text-emerald-600' : 'text-indigo-600'}">₹${groupTotal.toFixed(0)}</span>
              </div>
            </div>
          `;
        };

        return `
          <div class="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl min-w-[340px]">
            <div class="mb-3 text-[11px] font-black text-gray-600 uppercase tracking-widest text-center border-b border-gray-100 dark:border-gray-800 pb-2">${date} Audit</div>
            <div class="flex">
              ${renderGroup("Revenue Charged", 0, 4)}
              ${renderGroup("Financial Audit", 4, 6, true)}
            </div>
          </div>
        `;
      }
    },
  };

  const series = [
    // Group: Revenue
    { name: "Service", group: "revenue", data: seriesData.rev_service },
    { name: "Tax", group: "revenue", data: seriesData.rev_tax },
    { name: "Delivery", group: "revenue", data: seriesData.rev_delivery },
    { name: "Fees", group: "revenue", data: seriesData.rev_fees },
    // Group: Audit
    { name: "Profit", group: "audit", data: seriesData.audit_profit },
    { name: "Payouts", group: "audit", data: seriesData.audit_payouts },
    { name: "Logistics", group: "audit", data: seriesData.audit_logistics },
    { name: "Discounts", group: "audit", data: seriesData.audit_discounts },
    { name: "Comp", group: "audit", data: seriesData.audit_compensation },
    { name: "Marketing", group: "audit", data: seriesData.audit_marketing },
  ];

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Audit Comparison: Revenue vs Distribution
          </p>
        </div>

        <div className="relative inline-block">
          <button onClick={() => setIsOpen(!isOpen)} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-40 p-2">
            <DropdownItem onItemClick={() => setIsOpen(false)} className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
              Export Data
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[750px] xl:min-w-full pl-2">
          <ReactApexChart
            options={options}
            series={series as any}
            type="bar"
            height={350}
          />
        </div>
      </div>
    </div>
  );
}

