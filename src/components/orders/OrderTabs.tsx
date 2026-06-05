import React, { useMemo } from "react";
import OrderTable from "./OrderTable";
import { Order } from "@/types/order";
import { Tab, Tabs } from "@/components/ui/Tabs";

interface OrderTabsProps {
    orders: Order[];
    isLoading?: boolean;
    globalCounts: Record<string, number>;
    activeStatus: string;
    statusTabs: string[];
    onStatusChange: (index: number) => void;
    onEdit: (order: Order, section: "status" | "payment" | "financials" | "chat" | "reassign") => void;
    unreadCounts: Record<string, number>;
    priorityCounts: Record<string, number>;
    priorityTab: string;
    setPriorityTab: (tab: "all" | "standard" | "oneDay" | "express") => void;
    sortOrder: "asc" | "desc";
    setSortOrder: (order: "asc" | "desc") => void;
    onTriggerPorter: (orderId: string, type: "pickup" | "delivery") => void;
    onCancelPorter: (orderId: string, type: "pickup" | "delivery") => void;
    onDelete: (orderId: string) => void;
    isPorterLoading: Record<string, "pickup" | "delivery" | null>;
    isStatusUpdating: Record<string, boolean>;
    shopsMap: Record<string, any>;
}

const OrderTabs: React.FC<OrderTabsProps> = ({
    orders,
    isLoading = false,
    globalCounts,
    priorityCounts,
    activeStatus,
    priorityTab,
    setPriorityTab,
    sortOrder,
    setSortOrder,
    statusTabs,
    onStatusChange,
    unreadCounts,
    onEdit,
    onTriggerPorter,
    onCancelPorter,
    onDelete,
    isPorterLoading,
    isStatusUpdating,
    shopsMap
}) => {
    return (
        <Tabs 
            activeTab={statusTabs.indexOf(activeStatus)} 
            onTabChange={onStatusChange}
        >
            {statusTabs.map((status) => {
                let title = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                if (status === "all") title = "All Orders";
                if (status === "waiting_confirmation") title = "Waiting Confirmation";
                if (status === "waiting_user_review") title = "Waiting Review";
                if (status === "in_pickup") title = "In Pickup";
                if (status === "in_process") title = "In Process";
                if (status === "ready_to_deliver") title = "Ready To Deliver";
                if (status === "out_for_delivery") title = "Out For Delivery";
                
                const count = globalCounts[status] || 0;

                return (
                    <Tab key={status} title={title} count={count}>
                        <OrderTable
                            orders={orders}
                            isLoading={isLoading}
                            unreadCounts={unreadCounts}
                            priorityCounts={priorityCounts}
                            priorityTab={priorityTab}
                            setPriorityTab={setPriorityTab}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            onEdit={onEdit}
                            onTriggerPorter={onTriggerPorter}
                            onCancelPorter={onCancelPorter}
                            onDelete={onDelete}
                            isPorterLoading={isPorterLoading}
                            isStatusUpdating={isStatusUpdating}
                            shopsMap={shopsMap}
                        />
                    </Tab>
                );
            })}
        </Tabs>
    );
}

export default OrderTabs;
