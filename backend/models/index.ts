import { Sequelize } from 'sequelize-typescript';
import { User } from './User';
import { Product } from './Product';
import { Category } from './Category';
import { Sale } from './Sale';
import { Analytics } from './Analytics';
import * as dotenv from 'dotenv';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

const sequelize = new Sequelize({
  ...config,
  models: [User, Product, Category, Sale, Analytics],
  logging: env === 'development' ? console.log : false,
});

export { sequelize, User, Product, Category, Sale, Analytics };
