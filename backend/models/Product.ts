import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Default } from 'sequelize-typescript';
import { Category } from './Category';

@Table({
  tableName: 'products',
  timestamps: true,
  updatedAt: false,
})
export class Product extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  price!: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  stock!: number;

  @ForeignKey(() => Category)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  categoryId!: number;

  @BelongsTo(() => Category)
  category!: Category;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  imageUrl!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: true,
  })
  sku!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Cloudinary public_id for this product image',
  })
  cloudinaryId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  thumbnailUrl!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  mediumUrl!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Low-quality placeholder URL for lazy loading',
  })
  placeholderUrl!: string;
}
