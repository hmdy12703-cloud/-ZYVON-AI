import { Controller, Get, Param, Query } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { ListExercisesDto } from './dto/list-exercises.dto';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  list(@Query() query: ListExercisesDto) {
    return this.exercises.list(query);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.exercises.getBySlug(slug);
  }
}
