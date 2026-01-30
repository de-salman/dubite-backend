import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { DishModule } from './dish/dish.module';
import { CitiesModule } from './cities/cities.module';
import { ReviewModule } from './review/review.module';
import { StatsModule } from './stats/stats.module';
import { CategoryModule } from './category/category.module';
import { CuisineModule } from './cuisine/cuisine.module';

@Module({
  imports: [AuthModule, PrismaModule, RestaurantModule, DishModule, CitiesModule, ReviewModule, StatsModule, CategoryModule, CuisineModule],
  controllers: [AppController],
})
export class AppModule {}
