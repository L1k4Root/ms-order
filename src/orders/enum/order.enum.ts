import { OrderStatus } from "@prisma/client";

export const OrderStatusList = [
  OrderStatus.PENDING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELED,
];
