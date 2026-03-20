/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, ClientsModule, EventPattern } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import {
  OrderPaginationDTO,
  CreateOrderDto,
  ChangeOrderStatusDto,
} from './dto';
import { OrderWithProducts } from './interfaces/order-with-products.interface';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(createOrderDto);
    const paymentSession = await this.ordersService.createPaymentSession(order);
    return {
      order,
      paymentSession,
    };
  }

  @MessagePattern('findAllOrders')
  findAll(@Payload() orderPaginationDTO: OrderPaginationDTO) {
    return this.ordersService.findAll(orderPaginationDTO);
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload() id: string) {
    console.log('Finding order with ID:', id);
    return this.ordersService.findOne(id);
  }

  @MessagePattern('changeOrderStatus')
  changeOrderStatus(@Payload() data: ChangeOrderStatusDto) {
    console.log(
      'Changing status for order ID:',
      data.id,
      'to status:',
      data.status,
    );
    return this.ordersService.changeOrderStatus(data.id, data.status);
    // throw new RpcException('Not implemented yet');
  }

  @EventPattern('payment.suceeded')
  paidOrder(@Payload() payload) {
    console.log({ payload });
    return;
  }
}
