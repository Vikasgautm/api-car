"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBlogMetadata = exports.generateCarMetadata = void 0;
const generateCarMetadata = (car) => {
    return {
        title: `${car.car_name} Price, Images, Reviews & Specs | Car Salahakar`,
        description: `Check out ${car.car_name} price, specifications, features, and user reviews. Get expert advice and latest updates on ${car.car_name}.`,
        keywords: [car.car_name, 'car price', 'car specs', 'car reviews'],
        canonical: `https://carsalahakar.com/cars/${car.slug}`,
        ogImage: car.thumbnail?.preview,
    };
};
exports.generateCarMetadata = generateCarMetadata;
const generateBlogMetadata = (blog) => {
    return {
        title: `${blog.title} | Car Salahakar Blog`,
        description: blog.content.substring(0, 160).replace(/<[^>]*>/g, ''),
        keywords: ['car news', 'car blog', 'automotive updates'],
        canonical: `https://carsalahakar.com/blogs/${blog.slug}`,
        ogImage: blog.thumbnail?.preview,
    };
};
exports.generateBlogMetadata = generateBlogMetadata;
//# sourceMappingURL=seo.js.map