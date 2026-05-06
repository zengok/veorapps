import { Table, Column, Model, DataType, IsEmail, Default } from 'sequelize-typescript';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  username!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password!: string;

  @IsEmail
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email!: string;

  @Default('user')
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  role!: string;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  failedLoginAttempts!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lockUntil!: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  avatarUrl!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  avatarCloudinaryId!: string;
}
