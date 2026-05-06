import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Default } from 'sequelize-typescript';
import { Product } from './Product';
import { User } from './User';

@Table({
  tableName: 'sales',
  timestamps: false,
})
export class Sale extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  productId!: number;

  @BelongsTo(() => Product)
  product!: Product;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  quantity!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  totalPrice!: number;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  date!: Date;

  @Default('completed')
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  status!: string;
}
