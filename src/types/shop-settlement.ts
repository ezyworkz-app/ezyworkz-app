export interface ShopSettlement {
  shopSettlementId: string;
  orderId: string;
  shopId: string;
  userId: string;
  userName?: string;
  
  shopGrossAmount: number;
  originalGrossAmount?: number;
  shopCommissionAmount: number;
  shopCommissionPercentage: number;
  shopPriorityAmount: number;
  shopPriorityPercentage: number;
  shopPriorityType: 'express' | 'oneDay' | 'standard';
  shopLogisticsCost?: number;
  orderLogisticsCost?: number;
  isLogisticsCostManuallySet?: boolean;
  shopTotalAmount: number;
  
  status: "unpaid" | "paid";
  settledAt?: string;
  createdAt: string;
  orderCreatedAt?: string;
}
