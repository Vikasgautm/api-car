export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
}

export const generateCarMetadata = (car: any): SEOMetadata => {
  return {
    title: `${car.car_name} Price, Images, Reviews & Specs | Car Salahakar`,
    description: `Check out ${car.car_name} price, specifications, features, and user reviews. Get expert advice and latest updates on ${car.car_name}.`,
    keywords: [car.car_name, 'car price', 'car specs', 'car reviews'],
    canonical: `https://carsalahakar.com/cars/${car.slug}`,
    ogImage: car.thumbnail?.preview,
  };
};

export const generateBlogMetadata = (blog: any): SEOMetadata => {
  return {
    title: `${blog.title} | Car Salahakar Blog`,
    description: blog.content.substring(0, 160).replace(/<[^>]*>/g, ''),
    keywords: ['car news', 'car blog', 'automotive updates'],
    canonical: `https://carsalahakar.com/blogs/${blog.slug}`,
    ogImage: blog.thumbnail?.preview,
  };
};
