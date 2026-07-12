"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { format } from "date-fns";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Expense {
    expenseId: string;
    category: string;
    amount: number;
    description?: string;
    date: string;
}

interface ExpenseChartsProps {
    expenses: Expense[];
}

export function CategoryDonutChart({ expenses }: ExpenseChartsProps) {
    const data = useMemo(() => {
        const categories = expenses.reduce((acc, curr) => {
            const cat = curr.category.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            acc[cat] = (acc[cat] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

        const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
        return {
            labels: sorted.map(([label]) => label),
            series: sorted.map(([, amount]) => amount)
        };
    }, [expenses]);

    if (!data.series.length) {
        return <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No data available</div>;
    }

    return (
        <div className="h-64">
            <Chart
                type="donut"
                height="100%"
                options={{
                    labels: data.labels,
                    chart: { fontFamily: 'inherit', background: 'transparent' },
                    stroke: { width: 0 },
                    colors: ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6'],
                    dataLabels: { enabled: false },
                    tooltip: {
                        y: { formatter: (val) => `₹${val.toLocaleString('en-IN')}` }
                    },
                    legend: {
                        position: 'right',
                        fontSize: '12px',
                        markers: { size: 6 },
                    }
                }}
                series={data.series}
            />
        </div>
    );
}

export function SpendingTrendChart({ expenses }: ExpenseChartsProps) {
    const data = useMemo(() => {
        // Group by day
        const daily = expenses.reduce((acc, curr) => {
            const dateStr = format(new Date(curr.date), "MMM dd");
            acc[dateStr] = (acc[dateStr] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

        // Sort by date chronologically
        const sortedDates = Object.keys(daily).sort((a, b) => {
            return new Date(a + " 2026").getTime() - new Date(b + " 2026").getTime(); // Basic sorting
        });

        return {
            categories: sortedDates,
            series: sortedDates.map(date => daily[date])
        };
    }, [expenses]);

    if (!data.series.length) {
        return <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No data available</div>;
    }

    return (
        <div className="h-64">
            <Chart
                type="area"
                height="100%"
                options={{
                    chart: {
                        toolbar: { show: false },
                        fontFamily: 'inherit',
                        background: 'transparent'
                    },
                    colors: ['#8b5cf6'],
                    stroke: { curve: 'smooth', width: 2 },
                    fill: {
                        type: 'gradient',
                        gradient: {
                            shadeIntensity: 1,
                            opacityFrom: 0.4,
                            opacityTo: 0,
                            stops: [0, 100]
                        }
                    },
                    dataLabels: { enabled: false },
                    xaxis: {
                        categories: data.categories,
                        axisBorder: { show: false },
                        axisTicks: { show: false },
                        labels: { style: { colors: '#9ca3af' } }
                    },
                    yaxis: {
                        labels: {
                            style: { colors: '#9ca3af' },
                            formatter: (val) => `₹${(val / 1000).toFixed(1)}k`
                        }
                    },
                    grid: { borderColor: '#f3f4f6', strokeDashArray: 4 },
                    tooltip: {
                        y: { formatter: (val) => `₹${val.toLocaleString('en-IN')}` }
                    }
                }}
                series={[{ name: 'Expenses', data: data.series }]}
            />
        </div>
    );
}
