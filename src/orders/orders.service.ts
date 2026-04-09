/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
  OrderPaginationDTO,
  ChangeOrderStatusDto,
  CreateOrderDto,
  PaidOrderDto,
} from './dto';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';
import { OrderWithProducts } from './interfaces/order-with-products.interface';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
    private prisma: PrismaService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    try {
      const ids = createOrderDto.items.map((item) => item.productId);
      const products = await firstValueFrom(
        this.client.send({ cmd: 'validateProductsByIds' }, ids),
      );

      const totalAmount: number = products.reduce(
        (
          sum: number,
          item: { id: number; quantity: number; price: number },
        ) => {
          const orderItem = createOrderDto.items.find(
            (i) => i.productId === item.id,
          );

          if (orderItem) {
            item.quantity = orderItem.quantity;
          }

          return sum + item.price * item.quantity;
        },
        0,
      );

      const totalItems = createOrderDto.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );

      const order = await this.prisma.order.create({
        data: {
          totalItems: totalItems,
          totalPrice: totalAmount,

          orderItem: {
            createMany: {
              data: createOrderDto.items.map((item) => ({
                productId: item.productId.toString(),
                quantity: item.quantity,
                price: products.find(
                  (p: { id: number }) => p.id === item.productId,
                ).price,
              })),
            },
          },
        },
        include: {
          orderItem: {
            select: {
              productId: true,
              quantity: true,
              price: true,
            },
          },
        },
      });

      return {
        ...order,
        orderItem: order.orderItem.map((item) => ({
          ...item,
          name: products.find(
            (i: { id: number }) => i.id === parseInt(item.productId),
          ).name,
        })),
      };
    } catch (error) {
      this.logger.error('Error creating order', error);
      throw new RpcException({
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error validating products',
      });
    }
  }

  async createPaymentSession(order: OrderWithProducts) {
    return firstValueFrom(
      this.client.send('create.payment.session', {
        orderId: order.id,
        currency: 'usd',
        items: order.orderItem.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      }),
    );
  }

  async findAll(orderPaginationDTO: OrderPaginationDTO) {
    const totalPages = await this.prisma.order.count({
      where: {
        status: orderPaginationDTO.status,
      },
    });

    const currentPage = orderPaginationDTO.page ?? 1;
    const perPage = orderPaginationDTO.limit ?? 10;

    return {
      data: await this.prisma.order.findMany({
        where: {
          status: orderPaginationDTO.status,
        },
        skip: (currentPage - 1) * perPage,
        take: perPage,
      }),
      meta: {
        totalItems: totalPages,
        page: currentPage,
        lastPage: Math.ceil(totalPages / perPage),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItem: {
          select: {
            productId: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    if (!order) {
      throw new RpcException({
        code: HttpStatus.NOT_FOUND,
        message: `Order with ID ${id} not found`,
      });
    }
    const productIds = order.orderItem.map((item: { productId: any }) =>
      Number(item.productId),
    );
    const products: any = await firstValueFrom(
      this.client.send({ cmd: 'validateProductsByIds' }, productIds),
    );

    return {
      ...order,
      orderItem: order.orderItem.map((item: { productId: string }) => ({
        // productId: item.productId,
        // quantity: item.quantity,
        // price: item.price,
        name: products.find(
          (i: { id: number }) => i.id === parseInt(item.productId),
        ).name,
      })),
    };
  }

  async changeOrderStatus(
    id: string,
    status: ChangeOrderStatusDto['status'],
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id },
    });

    if (!order) {
      throw new RpcException({
        code: HttpStatus.NOT_FOUND,
        message: `Order with ID ${id} not found`,
      });
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  remove(id: string) {
    return `This action removes a #${id} order`;
  }

  async handlePaidOrder(payload: PaidOrderDto) {
    const { orderId, stripePaymentId, receiptUrl } = payload;

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paid: true,
        status: 'PAID',
        paidAt: new Date(),
        stripePaymentId,
        orderReceipts: {
          create: {
            receiptUrl,
          },
        },
      },
      include: {
        orderReceipts: true,
      },
    });
  }
}
