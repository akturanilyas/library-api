import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractModel } from './AbstractModel';
import { UserModel } from './User.model';
import { BookModel } from './Book.model';

@Entity('user_books')
export class UserBook extends AbstractModel {
  @Column({ type: 'bigint' })
  user_id: number;

  @Column({ type: 'bigint' })
  book_id: number;

  @Column({ type: 'datetime', nullable: true })
  delivery_date: Date;

  @Column({
    type: 'int',
    nullable: true,
  })
  score?: number;

  @ManyToOne(() => UserModel, user => user.books, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserModel;

  @ManyToOne(() => BookModel, book => book.history, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'book_id', referencedColumnName: 'id' })
  book: BookModel;
}