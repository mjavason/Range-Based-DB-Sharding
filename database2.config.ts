import { Sequelize } from 'sequelize-typescript';
import { User, Profile } from './user2.model';
import { SHARD_MAP } from './shard.config';

export const sequelize = new Sequelize({
  dialect: 'sqlite', // Choose your database dialect
  storage: SHARD_MAP[1].dbFile,
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  models: [User, Profile],
});

// Test the connection
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error: any) {
    console.error('Unable to connect to the database:', error.message);
  }
}

// Initialize Database
export async function initDB2() {
  try {
    await sequelize.sync({ force: false, alter: true }); // `force: true` will drop tables
    console.log('Database 2 synced successfully');
  } catch (err) {
    console.error('Unable to sync database:', err);
  }
}
