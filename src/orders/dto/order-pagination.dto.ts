import { IsEnum, IsOptional } from "class-validator";
import { PaginationDTO } from "../../common/dto/pagination.dto";
import { OrderStatusList } from "../enum/order.enum";
import { OrderStatus } from "@prisma/client";

export class OrderPaginationDTO extends PaginationDTO {
  @IsOptional()
  @IsEnum( OrderStatusList, {
    message: `Status must be one of the following values: ${OrderStatusList.join(', ')}`
  })
  status: OrderStatus;  
}
