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
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  private issuer = 'login';
  private audience = 'users';
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly mailer: MailerService,
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
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new NotFoundException(
        'Não existe usuário cadastrado com esse e-mail.',
      );
    }

    const token = this.jwtService.sign(
      {
        id: user.id,
      },
      {
        expiresIn: '10 minutes',
        subject: String(user.id),
        issuer: 'forget',
        audience: 'users',
      },
    );

    await this.mailer.sendMail({
      subject: 'Recuperação de senha',
      to: 'jose@josue.com',
      template: 'main',
      context: {
        name: user.name,
        token,
      },
    });

    return true;
  }

  async reset(password: string, token: string) {
    try {
      const data = this.jwtService.verify(token, {
        audience: 'forget',
        issuer: 'users',
      });

      if (isNaN(Number(data.id))) {
        throw new BadRequestException('Token Inválido.');
      }

      const salt = await bcrypt.genSalt();
      password = await bcrypt.hash(password, salt);

      const user = await this.prisma.user.update({
        where: {
          id: data.id,
        },
        data: {
          password: password,
        },
      });

      return this.createToken(user);
      return data;
    } catch (err) {
      throw new BadRequestException(err);
    }
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
