import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db/config';

interface RobotAttributes {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  pairs: number;
  params: object;
  workflow: object;  // Store workflow details as JSONB
}

interface RobotCreationAttributes extends Optional<RobotAttributes, 'id'> {}

class Robot extends Model<RobotAttributes, RobotCreationAttributes> implements RobotAttributes {
  public id!: string;
  public name!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public pairs!: number;
  public params!: object;
  public workflow!: object;
}

Robot.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    pairs: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    params: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    workflow: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'robots',
    timestamps: true,
  }
);

export default Robot;
