import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class UsersService {
  constructor(private readonly http: HttpService) {}

  getUsers(): Observable<unknown[]> {
    return this.http.get('https://jsonplaceholder.typicode.com/users').pipe(
      map((res) => res.data),
      catchError((e) => {
        throw 'todo error';
      }),
    );
  }
}
