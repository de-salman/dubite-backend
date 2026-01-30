import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CitiesService {
  constructor(private prisma: PrismaService) {}

  async getRestaurantsByCitySlug(citySlug: string) {
    const city = await this.prisma.city.findUnique({
      where: { slug: citySlug },
    });

    if (!city) {
      throw new NotFoundException('City not found');
    }

    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        city_id: city.id,
      },
      include: {
        city: true,
        cuisine: true,
        stats: true,
        _count: {
          select: {
            dishes: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Sort by stats.score if available, otherwise by created_at
    const sortedRestaurants = restaurants.sort((a, b) => {
      const scoreA = a.stats?.score ?? 0;
      const scoreB = b.stats?.score ?? 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Descending
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return sortedRestaurants;
  }

  async getDishesByCitySlugAndCategory(citySlug: string, category?: string) {
    const city = await this.prisma.city.findUnique({
      where: { slug: citySlug },
    });

    if (!city) {
      throw new NotFoundException('City not found');
    }

    // Build where clause - now using city_id directly (much faster!)
    const where: any = {
      city_id: city.id, // Direct filter on city_id - no need for restaurant subquery!
      is_active: true,
    };

    if (category) {
      // Find category by slug or name
      const categoryRecord = await this.prisma.category.findFirst({
        where: {
          OR: [
            { slug: category.toLowerCase() },
            { name: { equals: category, mode: 'insensitive' } },
          ],
        },
      });

      if (categoryRecord) {
        where.category_id = categoryRecord.id;
      }
    }

    const dishes = await this.prisma.dish.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            cuisine: true,
            city: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        stats: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Sort by stats.score and avg_rating if available
    const sortedDishes = dishes.sort((a, b) => {
      const scoreA = a.stats?.score ?? 0;
      const scoreB = b.stats?.score ?? 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Descending by score
      }
      const ratingA = a.stats?.avg_rating ?? 0;
      const ratingB = b.stats?.avg_rating ?? 0;
      if (ratingA !== ratingB) {
        return ratingB - ratingA; // Descending by rating
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Add rank to each dish (similar to getBestDishes)
    return sortedDishes.map((dish, index) => ({
      ...dish,
      rank: index + 1,
    }));
  }

  async getCuisineRanking(citySlug: string, cuisineType: string) {
    const city = await this.prisma.city.findUnique({
      where: { slug: citySlug },
    });

    if (!city) {
      throw new NotFoundException('City not found');
    }

    // Find cuisine by slug or name
    const cuisine = await this.prisma.cuisine.findFirst({
      where: {
        OR: [
          { slug: cuisineType.toLowerCase() },
          { name: { equals: cuisineType, mode: 'insensitive' } },
        ],
      },
    });

    if (!cuisine) {
      throw new NotFoundException('Cuisine not found');
    }

    // Get restaurants with this cuisine in the city
    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        city_id: city.id,
        cuisine_id: cuisine.id,
      },
      include: {
        city: true,
        cuisine: true,
        stats: true,
        dishes: {
          where: {
            is_active: true,
          },
          include: {
            category: true,
            stats: true,
          },
        },
        _count: {
          select: {
            dishes: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Sort by stats.score if available
    const sortedRestaurants = restaurants.sort((a, b) => {
      const scoreA = a.stats?.score ?? 0;
      const scoreB = b.stats?.score ?? 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Calculate cuisine-level stats
    const totalReviews = sortedRestaurants.reduce(
      (sum, r) => sum + (r.stats?.total_reviews || 0),
      0,
    );
    const avgScore =
      sortedRestaurants.length > 0
        ? sortedRestaurants.reduce((sum, r) => sum + (r.stats?.score || 0), 0) /
          sortedRestaurants.length
        : 0;
    const restaurantCount = sortedRestaurants.length;

    return {
      cuisine: {
        id: cuisine.id,
        name: cuisine.name,
        slug: cuisine.slug,
      },
      city: {
        id: city.id,
        name: city.name,
        slug: city.slug,
      },
      stats: {
        restaurant_count: restaurantCount,
        total_reviews: totalReviews,
        avg_score: avgScore,
      },
      restaurants: sortedRestaurants,
    };
  }

  async getCategories(citySlug: string) {
    // Find city
    const city = await this.prisma.city.findUnique({
      where: { slug: citySlug },
      select: { id: true },
    });

    if (!city) {
      throw new NotFoundException('City not found');
    }

    // Get dishes with categories - ordered by newest first
    // Now we can filter directly by city_id (much simpler!)
    const dishes = await this.prisma.dish.findMany({
      where: {
        city_id: city.id,
        is_active: true,
        image_url: { not: null },
      },
      select: {
        category: {
          select: {
            id: true,
            name: true,
            image_url: true,
          },
        },
        image_url: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Get unique categories (first occurrence = newest dish image)
    const categoryMap = new Map<string, { id: string; name: string; image: string }>();
    
    for (const dish of dishes) {
      if (dish.category && !categoryMap.has(dish.category.id)) {
        categoryMap.set(dish.category.id, {
          id: dish.category.id,
          name: dish.category.name,
          image: dish.category.image_url || dish.image_url || '',
        });
      }
    }

    return Array.from(categoryMap.values());
  }

  async getCuisines(citySlug: string) {
    const city = await this.prisma.city.findUnique({
      where: { slug: citySlug },
      select: { id: true },
    });

    if (!city) {
      throw new NotFoundException('City not found');
    }

    // Get all unique cuisines that have restaurants in this city
    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        city_id: city.id,
      },
      select: {
        cuisine: {
          select: {
            id: true,
            name: true,
            slug: true,
            image_url: true,
          },
        },
        image_url: true,
      },
    });

    // Get unique cuisines (first occurrence = first restaurant image)
    const cuisineMap = new Map<string, { id: string; name: string; slug: string; image: string }>();
    
    for (const restaurant of restaurants) {
      if (restaurant.cuisine && !cuisineMap.has(restaurant.cuisine.id)) {
        cuisineMap.set(restaurant.cuisine.id, {
          id: restaurant.cuisine.id,
          name: restaurant.cuisine.name,
          slug: restaurant.cuisine.slug,
          image: restaurant.cuisine.image_url || restaurant.image_url || '',
        });
      }
    }

    return Array.from(cuisineMap.values());
  }

  async getCityBySlug(slug: string) {
    const city = await this.prisma.city.findUnique({
      where: { slug },
    });

    if (!city) {
      throw new NotFoundException('City not found');
    }

    return city;
  }

  async getAllCities() {
    return this.prisma.city.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getBestDishes(citySlug: string) {
    const city = await this.prisma.city.findUnique({
      where: { slug: citySlug },
      select: { id: true },
    });

    if (!city) {
      throw new NotFoundException('City not found');
    }

    // Get all active dishes in the city with stats
    const dishes = await this.prisma.dish.findMany({
      where: {
        city_id: city.id,
        is_active: true,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            cuisine: true,
            city: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        stats: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Sort by stats.score (best first), then by avg_rating, then by created_at
    const sortedDishes = dishes.sort((a, b) => {
      const scoreA = a.stats?.score ?? 0;
      const scoreB = b.stats?.score ?? 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Descending by score
      }
      const ratingA = a.stats?.avg_rating ?? 0;
      const ratingB = b.stats?.avg_rating ?? 0;
      if (ratingA !== ratingB) {
        return ratingB - ratingA; // Descending by rating
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Add ranking number to each dish
    return sortedDishes.map((dish, index) => ({
      ...dish,
      rank: index + 1, // #1, #2, #3, etc.
    }));
  }
}