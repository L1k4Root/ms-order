# Order MS

## Qué hace

`order-ms` es el corazón del flujo de compra. Aquí vive la lógica de negocio de órdenes: valida productos, calcula totales, crea órdenes, consulta su estado y reacciona al evento de pago exitoso.

## Responsabilidades

- crear órdenes;
- listar órdenes con paginación y filtro por estado;
- obtener una orden;
- cambiar estado manualmente;
- crear la sesión de pago a través de `payments-ms`;
- marcar una orden como pagada cuando llega `payment.suceeded`.

## Persistencia

- Base de datos: PostgreSQL
- ORM: Prisma
- Modelos principales: `Order`, `OrderItem`, `OrderReceipt`

## Dependencias

- `products-ms` para validar productos
- `payments-ms` para iniciar checkout
- NATS para request/response y eventos

## Patterns y eventos

- `createOrder`
- `findAllOrders`
- `findOneOrder`
- `changeOrderStatus`
- evento `payment.suceeded`

## Variables de entorno

```env
PORT=3000
DATABASE_URL=postgresql://postgres:123456@localhost:5433/orderdb
NATS_SERVERS=nats://localhost:4222
```

## Qué mirar primero

1. `src/orders/orders.controller.ts`
2. `src/orders/orders.service.ts`
3. `prisma/schema.prisma`

## Notas de diseño

- este servicio orquesta más de un dominio y por eso es el más importante para entender el proyecto;
- el cálculo del total usa los precios consultados al catálogo;
- el pago no se confirma aquí directamente: espera un evento emitido por `payments-ms`.
