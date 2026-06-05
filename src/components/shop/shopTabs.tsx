import React from "react";
import { Tab, Tabs } from "../ui/Tabs";
import ShopTable from "./ShopTable";
import { Shop } from "@/types/Shop";
// import { Shop } from "../../types/shop"; // Update path if needed

interface ShopTabsProps {
  shops: Shop[];
  onEdit: (shop: Shop) => void;
  // onDelete: (shop: Shop) => void;
}

const ShopTabs: React.FC<ShopTabsProps> = ({
  shops,
  onEdit,

  // onDelete
}) => {
  const inProgress = shops.filter((shop) => shop.status === "in_progress");
  const pendingApproval = shops.filter(
    (shop) => shop.status === "pending_approval"
  );
  const approved = shops.filter((shop) => shop.status === "approved");
  const suspended = shops.filter((shop) => shop.status === "suspended");

  return (
    <Tabs>
      <Tab title="Approved" count={approved.length}>
        <ShopTable
          shops={approved}
          onEdit={onEdit}
        //  onDelete={onDelete}
        />
      </Tab>
      <Tab title="In Progress" count={inProgress.length}>
        <ShopTable
          shops={inProgress}
          onEdit={onEdit}
        // onDelete={onDelete}
        />
      </Tab>
      <Tab title="Pending Approval" count={pendingApproval.length}>
        <ShopTable
          shops={pendingApproval}
          onEdit={onEdit}
        // onDelete={onDelete}
        />
      </Tab>
      <Tab title="Suspended" count={suspended.length}>
        <ShopTable
          shops={suspended}
          onEdit={onEdit}
        //  onDelete={onDelete}
        />
      </Tab>
      <Tab title="All Shops" count={shops.length}>
        <ShopTable
          shops={shops}
          onEdit={onEdit}
        // onDelete={onDelete}
        />
      </Tab>
    </Tabs>
  );
};

export default ShopTabs;
