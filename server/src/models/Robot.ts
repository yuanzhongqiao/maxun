import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../storage/config';
import { WorkflowFile, Where, What, WhereWhatPair } from 'maxun-core';

interface RobotMeta {
  name: string;
  id: string;
  createdAt: string;
  pairs: number;
  updatedAt: string;
  params: any[];
}

interface RobotWorkflow {
  workflow: WhereWhatPair[];
}

interface RobotAttributes {
  id: string;
  recording_meta: RobotMeta;
  recording: RobotWorkflow;
}

interface RobotCreationAttributes extends Optional<RobotAttributes, 'id'> { }

class Robot extends Model<RobotAttributes, RobotCreationAttributes> implements RobotAttributes {
  public id!: string;
  public recording_meta!: RobotMeta;
  public recording!: RobotWorkflow;
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
    timestamps: false,
  }
);

export default Robot;