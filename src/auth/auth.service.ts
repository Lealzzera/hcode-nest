import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthRegisterDTO } from './dto/auth-register.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private issuer = 'login';
  private audience = 'users';
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  createToken(user: User) {
    return {
      accesToken: this.jwtService.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        {
          expiresIn: '7 days',
          subject: String(user.id),
          issuer: this.issuer,
          audience: this.audience,
        },
      ),
    };
  }

  checkToken(token: string) {
    try {
      const data = this.jwtService.verify(token, {
        audience: this.audience,
        issuer: this.issuer,
      });
      return data;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });
    if (!user) {
      throw new UnauthorizedException('E-mail e/ou senha inválidos.');
    } else {
      if (await bcrypt.compare(password, user.password)) {
        return this.createToken(user);
      } else {
        throw new UnauthorizedException('E-mail e/ou senha inválidos.');
      }
    }
  }

  async forget(email: string) {
    const user = this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new NotFoundException(
        'Não existe usuário cadastrado com esse e-mail.',
      );
    }

    //TO DO: Enviar email para troca de senha
    return true;
  }

  async reset(password: string, token: string) {
    //TO DO: Validar o token...
    const id = 0;
    console.log(token);

    const user = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        password,
      },
    });

    return this.createToken(user);
  }

  async register(data: AuthRegisterDTO) {
    const user = await this.userService.create(data);
    return this.createToken(user);
  }

  isValidToken(token: string) {
    try {
      this.checkToken(token);
      return true;
    } catch (err) {
      throw new UnauthorizedException('token inválido');
    }
  }
}
