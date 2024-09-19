import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

export interface IUser {
  shardId: number;
  username: string;
  email: string;
  password: string;
  profileId: number;
}

export interface IProfile {
  shardId: number;
  bio: string;
  avatarURL: string;
}

@Table({
  timestamps: true,
  defaultScope: { attributes: { exclude: ['createdAt', 'updatedAt'] } },
})
export class Profile extends Model {
  @Column({
    type: DataType.NUMBER,
    allowNull: false,
  })
  shardId!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  bio!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  avatarURL!: string;
}

@Table({
  timestamps: true,
  defaultScope: { attributes: { exclude: ['password', 'profileId'] } },
})
export class User extends Model {
  @Column({
    type: DataType.NUMBER,
    allowNull: false,
  })
  shardId!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  username!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password!: string;

  // Foreign key for Profile
  @ForeignKey(() => Profile)
  @Column({ type: DataType.INTEGER, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  profileId!: number;

  // Relationship with Profile
  @BelongsTo(() => Profile)
  profile!: Profile;
}
