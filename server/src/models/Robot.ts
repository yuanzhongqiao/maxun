import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../storage/db';
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
  google_sheets_email?: string | null;
  google_sheet_id?: string | null;
  google_access_token?: string | null;
  google_refresh_token?: string | null;
}

interface RobotCreationAttributes extends Optional<RobotAttributes, 'id'> { }

class Robot extends Model<RobotAttributes, RobotCreationAttributes> implements RobotAttributes {
  public id!: string;
  public recording_meta!: RobotMeta;
  public recording!: RobotWorkflow;
  public google_sheets_email!: string | null;
  public google_sheet_id?: string | null;
  public google_access_token!: string | null;
  public google_refresh_token!: string | null;
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
    google_sheets_email: {
      type: DataTypes.STRING,
      allowNull: true,
  },
  google_sheet_id: {
      type: DataTypes.STRING,
      allowNull: true,
  },
  google_access_token: {
      type: DataTypes.STRING,
      allowNull: true,
  },
  google_refresh_token: {
      type: DataTypes.STRING,
      allowNull: true,
  },
  },
  {
    sequelize,
    tableName: 'robot',
    timestamps: false,
  }
);

export default Robot;