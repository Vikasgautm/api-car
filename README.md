# Car Salahakar API - Complete REST API Reference

This document provides cURL examples to test all major modules and routes of the Car Salahakar API.

## Base URL
Default local development port: `50001`
Base API Path: `http://localhost:50001/api/v1`

---

## 1. Authentication Endpoints (`/auth`)

### Register User
Creates a new user account.
```bash
curl -X POST http://localhost:50001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "John Doe",
    "email": "johndoe@example.com",
    "password": "Password123!",
    "phone": "9876543210",
    "role": "user"
  }'
```

### Login User
Authenticates a user and returns their profile along with access/refresh tokens.
```bash
curl -X POST http://localhost:50001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "johndoe@example.com",
    "password": "Password123!"
  }'
```

### Refresh Token
Obtains a new Access Token.
```bash
curl -X POST http://localhost:50001/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### Get Session Profile
Retrieves the profile for the currently authenticated auth token.
```bash
curl -X GET http://localhost:50001/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Logout
Revokes the refresh token and ends the session.
```bash
curl -X POST http://localhost:50001/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Reset Password
Resets the password for a user using a valid reset token.
```bash
curl -X POST http://localhost:50001/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_PASSWORD_RESET_TOKEN",
    "user_id": "johndoe",
    "password": "NewSecurePassword123!"
  }'
```

---

## 2. Cars Endpoints (`/cars`)

### Public: List Cars
```bash
curl -X GET http://localhost:50001/api/v1/cars/public
```

### Public: Get Car By Slug
```bash
curl -X GET http://localhost:50001/api/v1/cars/public/honda-city
```

### Admin: List Cars
```bash
curl -X GET "http://localhost:50001/api/v1/cars/admin?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Create Car
```bash
curl -X POST http://localhost:50001/api/v1/cars/admin \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Honda City",
    "brand_id": "honda",
    "body_type_id": "sedan",
    "fuel_type_id": "petrol",
    "status": "launched",
    "exshowroom_price": 1150000
  }'
```

### Admin: Get Car Details
```bash
curl -X GET http://localhost:50001/api/v1/cars/admin/honda-city \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Update Car
```bash
curl -X PUT http://localhost:50001/api/v1/cars/admin/honda-city \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "exshowroom_price": 1180000
  }'
```

### Admin: Delete Car (Soft Delete)
```bash
curl -X DELETE http://localhost:50001/api/v1/cars/admin/honda-city \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Restore Car
```bash
curl -X PATCH http://localhost:50001/api/v1/cars/admin/restore/honda-city \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Toggle Publish Status
```bash
curl -X PATCH http://localhost:50001/api/v1/cars/admin/honda-city/publish \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

---

## 3. Variants Endpoints (`/variants`)

### Public: List Variants
```bash
curl -X GET http://localhost:50001/api/v1/variants/public
```

### Public: Get Variant by Slug
```bash
curl -X GET http://localhost:50001/api/v1/variants/public/honda-city-v-mt
```

### Admin: List Variants
```bash
curl -X GET "http://localhost:50001/api/v1/variants?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Create Variant
```bash
curl -X POST http://localhost:50001/api/v1/variants \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_name": "V MT",
    "car_id": "honda-city",
    "model_year": 2026,
    "transmission_type": "manual",
    "ex_showroom_price": 1150000
  }'
```

### Admin: Update Variant
```bash
curl -X PUT http://localhost:50001/api/v1/variants/honda-city-v-mt \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "ex_showroom_price": 1165000
  }'
```

### Admin: Delete Variant
```bash
curl -X DELETE http://localhost:50001/api/v1/variants/honda-city-v-mt \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Restore Variant
```bash
curl -X PATCH http://localhost:50001/api/v1/variants/restore/honda-city-v-mt \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

---

## 4. Brands Endpoints (`/brands`)

### Public: List Brands
```bash
curl -X GET http://localhost:50001/api/v1/brands/public
```

### Public: Get Brand By Slug
```bash
curl -X GET http://localhost:50001/api/v1/brands/public/honda
```

### Admin: List Brands
```bash
curl -X GET http://localhost:50001/api/v1/brands \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Create Brand
```bash
curl -X POST http://localhost:50001/api/v1/brands \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Honda",
    "description": "Honda Cars India"
  }'
```

### Admin: Update Brand
```bash
curl -X PUT http://localhost:50001/api/v1/brands/honda \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Honda Cars India Limited"
  }'
```

### Admin: Delete Brand
```bash
curl -X DELETE http://localhost:50001/api/v1/brands/honda \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Restore Brand
```bash
curl -X PATCH http://localhost:50001/api/v1/brands/restore/honda \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

---

## 5. Body Types Endpoints (`/body-types`)

### Public: List Body Types
```bash
curl -X GET http://localhost:50001/api/v1/body-types/public
```

### Public: Get Body Type By Slug
```bash
curl -X GET http://localhost:50001/api/v1/body-types/public/sedan
```

### Admin: List Body Types
```bash
curl -X GET http://localhost:50001/api/v1/body-types \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Create Body Type
```bash
curl -X POST http://localhost:50001/api/v1/body-types \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sedan",
    "description": "Three-box configuration passenger car"
  }'
```

### Admin: Update Body Type
```bash
curl -X PUT http://localhost:50001/api/v1/body-types/sedan \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Classic three-box layout passenger car"
  }'
```

### Admin: Delete Body Type
```bash
curl -X DELETE http://localhost:50001/api/v1/body-types/sedan \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Restore Body Type
```bash
curl -X PATCH http://localhost:50001/api/v1/body-types/restore/sedan \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

---

## 6. Fuel Types Endpoints (`/fuel-types`)

### Public: List Fuel Types
```bash
curl -X GET http://localhost:50001/api/v1/fuel-types/public
```

### Public: Get Fuel Type By Slug
```bash
curl -X GET http://localhost:50001/api/v1/fuel-types/public/petrol
```

### Admin: List Fuel Types
```bash
curl -X GET http://localhost:50001/api/v1/fuel-types \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Create Fuel Type
```bash
curl -X POST http://localhost:50001/api/v1/fuel-types \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Petrol",
    "description": "Gasoline fuel"
  }'
```

### Admin: Update Fuel Type
```bash
curl -X PUT http://localhost:50001/api/v1/fuel-types/petrol \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Premium unleaded gasoline fuel"
  }'
```

### Admin: Delete Fuel Type
```bash
curl -X DELETE http://localhost:50001/api/v1/fuel-types/petrol \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Restore Fuel Type
```bash
curl -X PATCH http://localhost:50001/api/v1/fuel-types/restore/petrol \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

---

## 7. Blogs Endpoints (`/blogs`)

### Public: List Blogs
```bash
curl -X GET http://localhost:50001/api/v1/blogs
```

### Public: Get Blog By Slug
```bash
curl -X GET http://localhost:50001/api/v1/blogs/slug/top-10-sedans-in-india
```

### Admin: Create Blog
```bash
curl -X POST http://localhost:50001/api/v1/blogs \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Top 10 Sedans in India",
    "content": "<p>These are the best sedans available...</p>",
    "category": "Buying Guides",
    "is_published": true
  }'
```

### Admin: Update Blog
```bash
curl -X PUT http://localhost:50001/api/v1/blogs/top-10-sedans-in-india \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Top 10 Best Sedans in India (2026)"
  }'
```

### Admin: Delete Blog
```bash
curl -X DELETE http://localhost:50001/api/v1/blogs/top-10-sedans-in-india \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Restore Blog
```bash
curl -X PATCH http://localhost:50001/api/v1/blogs/top-10-sedans-in-india/restore \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

---

## 8. Cities Endpoints (`/cities`)

### Public: List Cities
```bash
curl -X GET http://localhost:50001/api/v1/cities/public
```

### Admin: List Cities
```bash
curl -X GET http://localhost:50001/api/v1/cities \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Create City
```bash
curl -X POST http://localhost:50001/api/v1/cities \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Delhi",
    "state": "Delhi"
  }'
```

### Admin: Update City
```bash
curl -X PUT http://localhost:50001/api/v1/cities/new-delhi \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Delhi NCR"
  }'
```

### Admin: Delete City
```bash
curl -X DELETE http://localhost:50001/api/v1/cities/new-delhi \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Restore City
```bash
curl -X PATCH http://localhost:50001/api/v1/cities/restore/new-delhi \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

---

## 9. FAQs Endpoints (`/faqs`)

### Public: List FAQs
```bash
curl -X GET http://localhost:50001/api/v1/faqs/public
```

### Admin: Create FAQ
```bash
curl -X POST http://localhost:50001/api/v1/faqs \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the mileage of Honda City?",
    "answer": "The mileage ranges from 17.8 to 18.4 kmpl depending on variant.",
    "category": "honda-city"
  }'
```

### Admin: Update FAQ
```bash
curl -X PUT http://localhost:50001/api/v1/faqs/faq-id-here \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "answer": "The official certified mileage is 18.4 kmpl."
  }'
```

### Admin: Delete FAQ
```bash
curl -X DELETE http://localhost:50001/api/v1/faqs/faq-id-here \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Restore FAQ
```bash
curl -X PATCH http://localhost:50001/api/v1/faqs/restore/faq-id-here \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

---

## 10. Users Endpoints (`/users`)

### Public/Protected: Get User Profile
```bash
curl -X GET http://localhost:50001/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Public/Protected: Update User Profile
```bash
curl -X PUT http://localhost:50001/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "John Doe Updated",
    "phone": "9999988888"
  }'
```

### Admin: List All Users (Paginated)
```bash
curl -X GET "http://localhost:50001/api/v1/users/admin?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Create Admin/User
```bash
curl -X POST http://localhost:50001/api/v1/users/admin \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "Jane Admin",
    "email": "janeadmin@example.com",
    "role": "admin",
    "password": "AdminPassword123!",
    "is_active": true
  }'
```

### Admin: Get User By ID
```bash
curl -X GET http://localhost:50001/api/v1/users/admin/janeadmin \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Update User By ID
```bash
curl -X PUT http://localhost:50001/api/v1/users/admin/janeadmin \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "Jane Admin Modified",
    "is_active": false
  }'
```

### Admin: Delete User (Soft Delete)
```bash
curl -X DELETE http://localhost:50001/api/v1/users/admin/janeadmin \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

### Admin: Restore User
```bash
curl -X PATCH http://localhost:50001/api/v1/users/admin/restore/janeadmin \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```
