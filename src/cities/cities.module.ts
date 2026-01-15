import { Module } from '@nestjs/common';
import { CitiesController } from './cities.controller';
import { CitiesService } from './cities.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DishModule } from 'src/dish/dish.module';

@Module({
  imports: [PrismaModule, DishModule],
  controllers: [CitiesController],
  providers: [CitiesService],
})
export class CitiesModule {}