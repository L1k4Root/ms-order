import { OrderStatus } from '@prisma/client';

export interface OrderWithProducts {
  orderItem: {
    name: string;
    quantity: number;
    price: number;
  }[];
  id: string;
  totalPrice: number;
  totalItems: number;
  status: OrderStatus;
  paid: boolean;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
