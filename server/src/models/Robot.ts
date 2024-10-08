import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db/config';
import Run from './Run';

interface RobotMeta {
  name: string;
  id: string;
  createdAt: Date;
  pairs: number;
  updatedAt: Date;
  params: object[]; 
}

interface Robot {
  workflow: Array<{
    where: {
      url: string;
    };
    what: Array<{
      action: string;
      args: any[];
    }>;
  }>;
}

interface RobotAttributes {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  pairs: number;
  recording_meta: RobotMeta;
  recording: Robot;
}

interface RobotCreationAttributes extends Optional<RobotAttributes, 'id'> { }

class Robot extends Model<RobotAttributes, RobotCreationAttributes> implements RobotAttributes {
  public id!: string;
  public name!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public pairs!: number;
  public recording_meta!: RobotMeta;
  public recording!: Robot;
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
    // JSONB field for recording_meta (storing as a structured object)
    recording_meta: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    // JSONB field for recording (storing as a structured object)
    recording: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'robot',
    timestamps: true, 
  }
);

Robot.hasMany(Run, { foreignKey: 'robotId' });

export default Robot;
