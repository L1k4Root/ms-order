/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as joi from 'joi';
import 'dotenv/config';

interface EnvConfig {
  PORT: number;
  NATS_SERVERS: string[];
}

const envSchema = joi
  .object<EnvConfig>({
    PORT: joi.number().default(3000),
    NATS_SERVERS: joi.array().items(joi.string()).default(['nats://localhost:4222']),
  })
  .unknown(true); // Allow other variables

const { error, value } = envSchema.validate({
  ...process.env,
  NATS_SERVERS: (process.env.NATS_SERVERS ?? 'nats://localhost:4222').split(','),
});
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvConfig = value;

export const envConfig: EnvConfig = {
  PORT: envVars.PORT,
  NATS_SERVERS: envVars.NATS_SERVERS,
};
