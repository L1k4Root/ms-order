# Order MS Overview

`order-ms` es el servicio donde una intención de compra se vuelve estado duradero. Si el catálogo responde "qué existe" y pagos responde "si se cobró", este microservicio responde "qué compra estamos intentando completar y en qué estado está".

## Rol dentro del sistema

Este servicio ocupa el centro del flujo de compra porque conecta varias responsabilidades sin apropiarse de dominios ajenos:

- consulta catálogo para validar productos;
- construye y persiste la orden;
- solicita el inicio del checkout;
- reacciona cuando el pago se confirma;
- expone el estado acumulado de la compra.

Por eso es el servicio más cercano a una orquestación de negocio dentro del proyecto.

## Qué estado es dueño de conservar

La orden no es solo una lista de ítems. Aquí vive la versión persistida de una compra:

- cantidades y precios usados al momento de crearla;
- estado operativo de la orden;
- marca de pago exitoso;
- referencia externa del pago;
- recibo asociado cuando ya existe.

Eso le permite al sistema tener memoria del proceso aunque catálogo o pagos sean servicios separados.

## Cómo leer este servicio sin perderse

Hay una forma útil de recorrerlo:

1. primero mira cómo entra una orden;
2. luego sigue el cálculo y la persistencia;
3. después revisa cómo se dispara la sesión de pago;
4. por último mira cómo se consume el evento de pago exitoso.

Ese recorrido explica casi todo el propósito del servicio.

## Qué lo diferencia del resto

`order-ms` es el lugar donde más se nota el costo y el valor de trabajar con microservicios:

- necesita datos de otros contextos para avanzar;
- conserva su propia base de datos;
- coordina pasos síncronos y asíncronos;
- termina reflejando el estado "oficial" de la compra.

No debería convertirse en un reemplazo de catálogo ni de pagos, pero sí en el punto donde ambas capacidades se traducen en una orden consistente.

## Mapa rápido del código

- `src/orders/orders.controller.ts`: entrada por mensajería y consumo de eventos.
- `src/orders/orders.service.ts`: creación, consulta, cambio de estado y cierre por pago.
- `src/prisma`: acceso a la base de datos del servicio.
- `prisma/schema.prisma`: modelo persistente de órdenes, ítems y recibos.

## Cuándo venir aquí

Este es el servicio correcto cuando necesitas tocar el ciclo de vida de una compra: creación, estados, persistencia del pago, composición de la respuesta o reglas alrededor del pedido como entidad central.
