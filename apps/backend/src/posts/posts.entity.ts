import { User } from 'src/users/users.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToOne(() => User, (user) => user.id)
  // NOTE: Postテーブル内で外部キーとして使用されるカラムがathor_id
  //       この場合、Userテーブルのidカラムが参照される
  //       Userテーブルの別のカラムを参照したい場合、referencedColumnName: 'xx_id'と指定する
  @JoinColumn({ name: 'athor_id' })
  author: User;

  @Column('text')
  content: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
