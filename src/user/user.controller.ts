import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdatePutUserDTO } from './dto/update-put-user.dto';
import { UpdatePatchUserDTO } from './dto/update-patch-user.dto';
import { UserService } from './user.service';
import { ParamId } from 'src/decorators/param-id.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { RoleGuard } from 'src/guards/role.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(AuthGuard, RoleGuard)
@UseGuards(ThrottlerGuard)
@Controller('users')
@Roles(Role.Admin)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() body: CreateUserDTO) {
    return this.userService.create(body);
  }

  @SkipThrottle()
  @Get()
  async read() {
    return this.userService.read();
  }

  @Get(':id')
  async readOne(@ParamId() id: number) {
    return this.userService.readOne(id);
  }

  @Put(':id')
  async update(@Body() body: UpdatePutUserDTO, @ParamId() id: number) {
    return this.userService.update(body, id);
  }

  @Patch(':id')
  async partialUpdate(
    @Body() body: UpdatePatchUserDTO,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userService.partialUpdate(body, id);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.userService.delete(id);
    return { message: 'Usuário excluído com sucesso.' };
  }
}
