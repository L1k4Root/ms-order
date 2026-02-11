import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDTO, ChangeOrderStatusDto, CreateOrderDto } from './dto';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy, private prisma: PrismaService) {
  }
  
  async create(createOrderDto: CreateOrderDto) {
    try {
      // Validate products exist by communicating with Products microservice  
      const products1 = createOrderDto.items
      const ids = products1.map(item => item.productId);
      const products: any = await firstValueFrom(this.client.send({ cmd: 'validateProductsByIds' }, ids));

      // Calculate information for order creation
      const totalAmount = products.reduce((sum, item) => {

        const orderItem = createOrderDto.items.find(i => i.productId === item.id);
        console.log('Matching order item for product:', item.id, orderItem);
        if (orderItem) {
          item.price = item.price;
          item.quantity = orderItem.quantity;
        }

        return sum + (item.price * item.quantity)
      }, 0);

      // console.log('Total amount calculated:', totalAmount);
      // return totalAmount;

      const totalItems = createOrderDto.items.reduce((sum, item) => sum + item.quantity, 0);

      const order = await this.prisma.order.create({
        data: {
          totalItems: totalItems,
          totalPrice: totalAmount,

          orderItem: {
            createMany: {
              data: createOrderDto.items.map(item => ({
                productId: item.productId.toString(),
                quantity: item.quantity,
                price: products.find((p: { id: number; }) => p.id === item.productId).price,
              }))
            },
          }
        },
        include: {
          orderItem: {
            select: {
              productId: true,
              quantity: true,
              price: true,

            }
          }
        },

      })
      return {
        ...order,
        orderItem: order.orderItem.map(item => ({
          ...item,
          name: products.find(i => i.id === parseInt(item.productId)).name,
        }))  
        
      }
      


    } catch (error) {

      Logger.error('Error validating products', error);
      throw new RpcException({
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error validating products',

      });
    }


    // return {
    //   Message : 'Order created successfully',
    //   order: createOrderDto
    // }
    // return this.prisma.order.create({
    //   data: createOrderDto,
    // });
  }

  async findAll(orderPaginationDTO: OrderPaginationDTO) {

    const totalPages = await this.prisma.order.count({
      where: {
        status: orderPaginationDTO.status,
      }
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

      }

    }
  }
  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },

      // Second try: Include order items directly
      include: {
        orderItem: {
          select: {
            productId: true,
            quantity: true,
            price: true,
          }
        },
      },
    });


    if (!order) {
      console.log(`Order with ID ${id} not found`);
      throw new RpcException({
        code: HttpStatus.NOT_FOUND,
        message: `Order with ID ${id} not found`,
      });
    }
    const productIds = order.orderItem.map(item => Number(item.productId));
    const products: any = await firstValueFrom(this.client.send({ cmd: 'validateProductsByIds' }, productIds));

    return {
      ...order,
      orderItem: order.orderItem.map(item => ({
        // productId: item.productId,
        // quantity: item.quantity,
        // price: item.price,
        name: products.find(i => i.id === parseInt(item.productId)).name,
      })
      ),
    }








    // First try

    // const orderItems = await this.prisma.orderItem.findMany({
    //   where: { orderId: id },
    // });
    // const products: any = await firstValueFrom(this.productsClient.send({ cmd: 'validateProductsByIds' }, orderItems.map(item => Number(item.productId))));
    // return {
    //   ...order,
    //   orderItems: orderItems.map(item => ({
    //     productId: item.productId,
    //     quantity: item.quantity,
    //     price: item.price,
    //     name: products.find(i => i.id === parseInt(item.productId)).name,
    //   })
    //   ),
    // };
  }


  changeOrderStatus(id: string, status: ChangeOrderStatusDto['status']) {
    const order = this.prisma.order.findFirst({
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
      data: { status: status },
    });
  }

  remove(id: string) {
    return `This action removes a #${id} order`;
  }
}
