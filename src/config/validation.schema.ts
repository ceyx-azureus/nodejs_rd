import * as Joi from 'joi';

const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'example', 'local', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('3d'),
});

export default validationSchema;
