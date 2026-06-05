"use client";
import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { useRouter, useSearchParams } from "next/navigation";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

interface SegmentationChartProps {
    data: {
        FIRST_TIME: number;
        INACTIVE_ONE_TIME: number;
        INACTIVE_FREQUENT: number;
    };
    onSegmentClick?: (segment: "FIRST_TIME" | "INACTIVE_ONE_TIME" | "INACTIVE_FREQUENT") => void;
}

const SegmentationChart: React.FC<SegmentationChartProps> = ({ data, onSegmentClick }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const series = [data.FIRST_TIME, data.INACTIVE_ONE_TIME, data.INACTIVE_FREQUENT];
    const segmentIds: ("FIRST_TIME" | "INACTIVE_ONE_TIME" | "INACTIVE_FREQUENT")[] = ["FIRST_TIME", "INACTIVE_ONE_TIME", "INACTIVE_FREQUENT"];
    
    const options: ApexOptions = {
        chart: {
            type: "donut",
            fontFamily: "Outfit, sans-serif",
            events: {
                dataPointSelection: (event, chartContext, config) => {
                    const seg = segmentIds[config.dataPointIndex];
                    if (onSegmentClick) {
                        onSegmentClick(seg);
                    } else {
                        // Default drill-down behavior
                        const params = new URLSearchParams(searchParams);
                        params.set("segment", seg);
                        params.set("page", "1");
                        router.push(`?${params.toString()}`);
                    }
                }
            }
        },
        colors: ["#6366f1", "#f97316", "#ef4444"],
        labels: ["First-Time", "Inactive (1)", "Inactive (Frequent)"],
        legend: {
            show: true,
            position: "bottom",
            fontFamily: "Outfit",
            fontSize: "12px",
            markers: {
                strokeWidth: 0,
            },
            itemMargin: {
                horizontal: 10,
                vertical: 5
            }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: "75%",
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: "Total Leads",
                            fontSize: "12px",
                            fontFamily: "Outfit",
                            fontWeight: 600,
                            color: "#6b7280",
                            formatter: function (w) {
                                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toLocaleString();
                            }
                        },
                        value: {
                            show: true,
                            fontSize: "24px",
                            fontFamily: "Outfit",
                            fontWeight: 700,
                            color: "inherit",
                            offsetY: 5,
                        }
                    }
                }
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: false
        },
        tooltip: {
            enabled: true,
            theme: "dark"
        },
        states: {
            hover: {
                filter: {
                    type: "darken",
                }
            },
            active: {
                allowMultipleDataPointsSelection: false,
                filter: {
                    type: "none"
                }
            }
        },
        responsive: [
            {
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: "bottom"
                    }
                }
            }
        ]
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/50 flex flex-col items-center justify-center h-[400px]">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 self-start">
                Segment Distribution
            </h3>
            <div className="w-full flex justify-center flex-1 items-center">
                <ReactApexChart
                    options={options}
                    series={series}
                    type="donut"
                    width={320}
                />
            </div>
        </div>
    );
};

export default SegmentationChart;
