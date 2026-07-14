import dotenv from 'dotenv';

dotenv.config();

export const sqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || '',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'api_car',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  connectionLimit: 15,
};
