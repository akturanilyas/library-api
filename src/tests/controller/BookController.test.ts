import { describe } from '@jest/globals';
import {
  getRequest,
  matchArrayKeys,
  matchObjectKeys,
  postRequest,
} from '../../utils/testUtils';
import { ENDPOINT } from '../../constants/endpoint.constant';
import { BookService } from '../../services/BookService';
import { UserService } from '../../services/UserService';
import HttpStatusCode from '../../enums/httpStatus.enum';

describe('BookController', () => {
  it('check book create endpoint', async () => {
    const res = await postRequest({
      path: `${ENDPOINT.BOOKS}`,
      body: { name: 'name' },
    });

    expect(res.statusCode).toBe(HttpStatusCode.CREATED);
    matchObjectKeys(res.body, ['id', 'name']);
  });

  it('check book index endpoint', async () => {
    await new BookService().createBook({ name: 'Book 1' });
    await new BookService().createBook({ name: 'Book 2' });
    await new BookService().createBook({ name: 'Book 3' });

    const res = await getRequest({
      path: `${ENDPOINT.BOOKS}`,
    });

    expect(res.statusCode).toBe(HttpStatusCode.OK);

    matchArrayKeys(res.body, ['id', 'name']);
  });

  it('check book borrow endpoint', async () => {
    const book = await new BookService().createBook({ name: 'Book 1' });
    const user = await new UserService().createUser({
      name: 'First name',
    });

    const res = await postRequest({
      path: `${ENDPOINT.USERS}/${user.id}${ENDPOINT.BORROW}/${book.id}`,
      body: {},
    });

    expect(res.statusCode).toBe(HttpStatusCode.CREATED);
  });

  it('check book return endpoint', async () => {
    const book = await new BookService().createBook({ name: 'Book 1' });
    const user = await new UserService().createUser({
      name: 'First name',
    });

    await new BookService().borrowBook({
      user_id: user.id,
      book_id: book.id,
    });

    const res = await postRequest({
      path: `${ENDPOINT.USERS}/${user.id}${ENDPOINT.RETURN}/${book.id}`,
    });

    expect(res.statusCode).toBe(HttpStatusCode.OK);
  });

  it('check show book endpoint', async () => {
    const userService = new UserService();
    const bookService = new BookService();

    const book = await bookService.createBook({ name: 'Book 1' });
    const user = await userService.createUser({
      name: 'First name',
    });

    await bookService.borrowBook({
      user_id: user.id,
      book_id: book.id,
    });

    await bookService.returnBook({
      user_id: user.id,
      book_id: book.id,
      score: 8,
    });

    const res = await getRequest({
      path: `${ENDPOINT.BOOKS}/${book.id}`,
    });

    expect(res.statusCode).toBe(HttpStatusCode.OK);
    expect(res.body).toMatchObject({ name: 'Book 1', score: 8 });
  });

  it('check not found exception', async () => {
    const res = await getRequest({
      path: `${ENDPOINT.BOOKS}/1`,
    });

    expect(res.statusCode).toBe(HttpStatusCode.NOT_FOUND);
    expect(res.body.message).toBe('Book not found');
  });

  it('check BookAlreadyReturnedException', async () => {
    const book = await new BookService().createBook({ name: 'Book 1' });
    const user = await new UserService().createUser({
      name: 'First name',
    });

    await new BookService().borrowBook({
      user_id: user.id,
      book_id: book.id,
    });

    await postRequest({
      path: `${ENDPOINT.USERS}/${user.id}${ENDPOINT.RETURN}/${book.id}`,
    });

    const res = await postRequest({
      path: `${ENDPOINT.USERS}/${user.id}${ENDPOINT.RETURN}/${book.id}`,
    });

    expect(res.statusCode).toBe(HttpStatusCode.NOT_FOUND);
    expect(res.body.message).toBe('User book not found');
  });

  it('check UserBookNotFoundException', async () => {
    const user = await new UserService().createUser({
      name: 'First name',
    });

    const book = await new BookService().createBook({ name: 'Book 1' });

    const res = await postRequest({
      path: `${ENDPOINT.USERS}/${user.id}${ENDPOINT.RETURN}/${book.id}`,
    });

    expect(res.statusCode).toBe(HttpStatusCode.NOT_FOUND);
    expect(res.body.message).toBe('User book not found');
  });

  it('check BookAlreadyBorrowedException', async () => {
    const user = await new UserService().createUser({
      name: 'First name',
    });

    const book = await new BookService().createBook({ name: 'Book 1' });

    await postRequest({
      path: `${ENDPOINT.USERS}/${user.id}${ENDPOINT.BORROW}/${book.id}`,
    });

    const res = await postRequest({
      path: `${ENDPOINT.USERS}/${user.id}${ENDPOINT.BORROW}/${book.id}`,
      body: {},
    });

    expect(res.statusCode).toBe(HttpStatusCode.CONFLICT);
    expect(res.body.message).toBe('Book already borrowed.');
  });

  it('check throw exception when taken book want to take again', async () => {
    const user = await new UserService().createUser({
      name: 'First name',
    });

    const user2 = await new UserService().createUser({
      name: 'Second User',
    });

    const book = await new BookService().createBook({ name: 'Book 1' });

    await postRequest({
      path: `${ENDPOINT.USERS}/${user.id}${ENDPOINT.BORROW}/${book.id}`,
    });

    const res = await postRequest({
      path: `${ENDPOINT.USERS}/${user2.id}${ENDPOINT.BORROW}/${book.id}`,
    });

    expect(res.statusCode).toBe(HttpStatusCode.CONFLICT);
    expect(res.body.message).toBe('Book already borrowed.');
  });

  it('check borrowed and returned book take again case', async () => {
    const user = await new UserService().createUser({
      name: 'First name',
    });

    const book = await new BookService().createBook({ name: 'Book 1' });

    await postRequest({
      path: `${ENDPOINT.USERS}/${user.id}${ENDPOINT.BORROW}/${book.id}`,
    });

    await postRequest({
      path: `${ENDPOINT.USERS}/${user.id}${ENDPOINT.RETURN}/${book.id}`,
    });

    const res = await postRequest({
      path: `${ENDPOINT.USERS}/${user.id}${ENDPOINT.BORROW}/${book.id}`,
    });

    expect(res.statusCode).toBe(HttpStatusCode.CREATED);
    matchObjectKeys(res.body, ['book_id', 'score', 'user_id']);
  });
});
