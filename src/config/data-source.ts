import 'dotenv/config';
import { DataSource } from 'typeorm';

const isCompiled = __filename.endsWith('.js');

export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: isCompiled ? ['dist/**/*.entity.js'] : ['src/**/*.entity{.ts,.js}'],
  migrations: isCompiled ? ['dist/migrations/*.js'] : ['src/migrations/*{.ts,.js}'],
  synchronize: false,
});
