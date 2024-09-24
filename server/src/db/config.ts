import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME as string,
    process.env.DB_USER as string,
    process.env.DB_PASSWORD as string,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false,
    }
);

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

export const syncDB = async () => {
    try {
      await sequelize.sync({ force: false });  // force: true will drop and recreate tables on every run
      console.log('Database synced successfully!');
    } catch (error) {
      console.error('Failed to sync database:', error);
    }
  };
  

export default sequelize;