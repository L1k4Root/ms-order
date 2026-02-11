import { IsNumber, IsPositive } from "class-validator";

export class CreateOrderItemDto {
  
  @IsNumber()
  @IsPositive()
  productId: number;
  @IsNumber()
  @IsPositive()
  quantity: number

}