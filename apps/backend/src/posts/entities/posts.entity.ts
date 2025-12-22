import { User } from 'src/users/users.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tag } from './tag.entity';

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

  // NOTE: こちらが所有側なので、@JoinTable()を指定する必要がある
  //       これにより中間テーブルが作成され、PostとTagの多対多の関係が確立される
  //       cascade: true を指定することで、Postエンティティを保存・更新する際に関連するTagエンティティも自動的に保存・更新されるが、
  //       今回は既存タグの検索などのロジックを挟むため、Service層で対応する
  @ManyToMany(() => Tag, (tag) => tag.posts)
  @JoinTable()
  tags: Tag[];

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
