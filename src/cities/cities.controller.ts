import { Controller, Get, Param, Query } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { DishService } from 'src/dish/dish.service';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService,
    private readonly dishService: DishService,) {}

  @Get()
  getAllCities() {
    return this.citiesService.getAllCities();
  }

  @Get(':slug/restaurants')
  getRestaurantsByCity(@Param('slug') slug: string) {
    return this.citiesService.getRestaurantsByCitySlug(slug);
  }

  @Get('restaurants/:restaurantId/dishes')
  getDishesByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.dishService.findByRestaurant(restaurantId);
  }

  @Get(':slug/dishes')
  getDishesByCity(
    @Param('slug') slug: string,
    @Query('category') category?: string,
  ) {
    return this.citiesService.getDishesByCitySlugAndCategory(slug, category);
  }

  @Get(':slug/cuisines/:type')
  getCuisineRanking(
    @Param('slug') slug: string,
    @Param('type') type: string,
  ) {
    return this.citiesService.getCuisineRanking(slug, type);
  }

  @Get(':slug/categories')
  getCategories(@Param('slug') slug: string) {
    return this.citiesService.getCategories(slug);
  }

  @Get(':slug/cuisines')
  getCuisines(@Param('slug') slug: string) {
    return this.citiesService.getCuisines(slug);
  }

  @Get(':slug/best-dishes')
  getBestDishes(@Param('slug') slug: string) {
    return this.citiesService.getBestDishes(slug);
  }

  @Get(':slug')
  getCityBySlug(@Param('slug') slug: string) {
    return this.citiesService.getCityBySlug(slug);
  }
}