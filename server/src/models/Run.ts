import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db/config';
import Robot from './Robot';

interface RunAttributes {
    id: string;
    robotId: string;
    status: string;
    name: string;
    startedAt: Date;
    finishedAt: Date;
    browserId: string;
    interpreterSettings: object;
    log: string;
    serializableRun: object;
    binaryRunUrl: string;
}

interface RunCreationAttributes extends Optional<RunAttributes, 'id'> { }

class Run extends Model<RunAttributes, RunCreationAttributes> implements RunAttributes {
    public id!: string;
    public robotId!: string;
    public status!: string;
    public name!: string;
    public startedAt!: Date;
    public finishedAt!: Date;
    public browserId!: string;
    public interpreterSettings!: object;
    public log!: string;
    public serializableRun!: object;
    public binaryRunUrl!: string;
}

Run.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        robotId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: Robot,
                key: 'id',
            },
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        startedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        finishedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        browserId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        interpreterSettings: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        log: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        serializableRun: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        binaryRunUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'run',
        timestamps: false,
    }
);

Run.belongsTo(Robot, { foreignKey: 'robotId' });

export default Run;
