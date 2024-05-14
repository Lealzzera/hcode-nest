import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePutUserDTO } from './dto/update-put-user.dto';
import { UpdatePatchUserDTO } from './dto/update-patch-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDTO) {
    data.password = await bcrypt.hash(data.password, await bcrypt.genSalt());
    return this.prisma.user.create({ data });
  }

  async read() {
    return this.prisma.user.findMany();
  }

  async readOne(id: number) {
    if (
      !(await this.prisma.user.count({
        where: { id },
      }))
    )
      throw new NotFoundException('Usuário não encontrado');
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async update(
    { email, password, age, name, birthAt, role }: UpdatePutUserDTO,
    id: number,
  ) {
    password = await bcrypt.hash(password, await bcrypt.genSalt());

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        email,
        role,
        password,
        age,
        name,
        birthAt: birthAt ? new Date(birthAt) : null,
      },
    });
  }

  async partialUpdate(
    { email, name, password, age, birthAt, role }: UpdatePatchUserDTO,
    id: number,
  ) {
    password = await bcrypt.hash(password, await bcrypt.genSalt());

    return this.prisma.user.update({
      data: {
        email,
        name,
        password,
        age,
        birthAt: birthAt ? new Date(birthAt) : null,
        role,
      },
      where: {
        id,
      },
    });
  }
  async delete(id: number) {
    if (!(await this.readOne(id))) {
      throw new NotFoundException(`Usuário ${id} não encontrado!`);
    }
    return this.prisma.user.delete({
      where: {
        id,
      },
    });
  }
}
