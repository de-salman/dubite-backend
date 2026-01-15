import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { DishModule } from './dish/dish.module';
import { CitiesModule } from './cities/cities.module';
import { ReviewModule } from './review/review.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [AuthModule, PrismaModule, RestaurantModule, DishModule, CitiesModule, ReviewModule, StatsModule]
})
export class AppModule {}
