import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'analytics',
  timestamps: true,
})
export class Analytics extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: "'daily' or 'monthly'",
  })
  periodType!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  periodDate!: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  totalSales!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  totalRevenue!: number;
}
