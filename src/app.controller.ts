import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      ok: true,
      message: 'Dubite API',
      endpoints: {
        cities: '/cities',
        cityBySlug: '/cities/:slug (e.g. /cities/dubai)',
        auth: '/auth/login, /auth/register',
        dishes: '/dishes',
        restaurants: '/restaurants',
        reviews: '/reviews/featured',
      },
    };
  }
}
