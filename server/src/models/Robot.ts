import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db/config';
import Run from './Run';

interface RobotMeta {
  name: string;
  id: string;
  createdAt: string;
  pairs: number;
  updatedAt: string;
  params: any[];
}

interface Workflow {
  where: {
    url: string;
  };
  what: Array<{
    action: string;
    args: any[];
  }>;
}

interface Robot {
  workflow: Workflow[];
}

interface RobotAttributes {
  id: string;
  recording_meta: RobotMeta;
  recording: Robot;
}

interface RobotCreationAttributes extends Optional<RobotAttributes, 'id'> {}

class Robot extends Model<RobotAttributes, RobotCreationAttributes> implements RobotAttributes {
  public id!: string;
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
    recording_meta: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    recording: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'robot',
    timestamps: false, // We'll manage timestamps manually in recording_meta
  }
);

Robot.hasMany(Run, { foreignKey: 'robotId' });

export default Robot;
