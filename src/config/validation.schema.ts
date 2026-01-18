import * as Joi from 'joi';

const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'local', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
});

export default validationSchema;
