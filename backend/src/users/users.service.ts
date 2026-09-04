import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: email.toLowerCase().trim() } });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  async create(data: { email: string; passwordHash: string; fullname: string }): Promise<User> {
    const user = this.users.create({
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      fullname: data.fullname,
    });

    return this.users.save(user);
  }
}
