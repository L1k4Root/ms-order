import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { OrderPaginationDTO, CreateOrderDto, ChangeOrderStatusDto } from './dto';


@Controller()
export class OrdersController {
  constructor( private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
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
    console.log('Changing status for order ID:', data.id, 'to status:', data.status);
    return this.ordersService.changeOrderStatus(data.id, data.status);
    // throw new RpcException('Not implemented yet');
  }

  
  
}
