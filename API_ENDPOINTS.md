# Car Salahakar API - CURL Documentation

Base URL: `http://localhost:3000/api/v1`

## Authentication

### Sign Up
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
-H "Content-Type: application/json" \
-d '{
  "user_name": "testuser",
  "email": "user@example.com",
  "password": "password123",
  "phone": "1234567890"
}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "user@example.com",
  "password": "password123"
}'
```

---

## Cars

### Get All Cars
```bash
curl -X GET "http://localhost:3000/api/v1/cars?page=1&limit=10&category=latest"
```

### Get Car by Slug
```bash
curl -X GET http://localhost:3000/api/v1/cars/toyota-fortuner
```

### Create Car (Admin)
```bash
curl -X POST http://localhost:3000/api/v1/cars \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <YOUR_TOKEN>" \
-d '{
  "car_name": "Toyota Fortuner",
  "description": "Premium SUV",
  "brand_id": "brand-uuid",
  "body_type_id": "body-type-uuid",
  "thumbnail": { "preview": "url", "title": "title" },
  "images": [{ "preview": "url", "title": "title" }],
  "link": "/cars/toyota-fortuner",
  "latest": true
}'
```

---

## Brands

### Get All Brands
```bash
curl -X GET "http://localhost:3000/api/v1/brands?q=Toyota"
```

### Get Brand by Slug
```bash
curl -X GET http://localhost:3000/api/v1/brands/toyota
```

---

## Blogs

### Get All Blogs
```bash
curl -X GET "http://localhost:3000/api/v1/blogs?page=1&limit=5"
```

### Get Blog by Slug
```bash
curl -X GET http://localhost:3000/api/v1/blogs/upcoming-cars-2026
```

---

## Cities

### Get All Cities
```bash
curl -X GET "http://localhost:3000/api/v1/cities?q=Mumbai"
```

---

## FAQs

### Get All FAQs
```bash
curl -X GET "http://localhost:3000/api/v1/faqs?category=maintenance"
```

---

## Car Comparison

### Get All Comparisons
```bash
curl -X GET http://localhost:3000/api/v1/car-compare
```

### Get Comparison by Route
```bash
curl -X GET http://localhost:3000/api/v1/car-compare/fortuner-vs-endeavour
```

---

## Image Upload

### Upload Image (Admin)
```bash
curl -X POST http://localhost:3000/api/v1/images/upload \
-H "Authorization: Bearer <YOUR_TOKEN>" \
-F "image=@/path/to/your/image.jpg"
```
