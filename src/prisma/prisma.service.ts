// src/prisma/prisma.service.ts
import 'dotenv/config'; // para asegurarnos de tener .env cargado aquí también
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger('Database Connection');

  constructor() {
    // 1. Creamos el pool de pg usando la DATABASE_URL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // 2. Creamos el adapter para Prisma
    const adapter = new PrismaPg(pool);

    // 3. Llamamos al constructor de PrismaClient con opciones válidas
    super({ adapter });

    // Opcional: pequeño log para ver que el constructor se ejecutó bien
    this.logger.log('PrismaService constructed with PrismaPg adapter');
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from the database');
  }
}
