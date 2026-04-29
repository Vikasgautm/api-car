# FAQ Module Documentation

## Overview
The FAQ module provides comprehensive CRUD operations for managing frequently asked questions with advanced filtering, search, and categorization capabilities.

## Features
- Create, update, delete, and restore FAQs
- Soft delete support
- Publish/unpublish toggle
- Featured FAQ management
- View count tracking with atomic increments
- Advanced filtering by category, tag, group, and featured status
- Full-text search across questions and answers
- Pagination and sorting support
- Slug generation with uniqueness validation

## Model Schema

### FAQ Model (`src/models/faq.model.ts`)

```typescript
{
  faq_id: string;           // UUID identifier
  question: string;         // Required, min 10 chars
  answer: string;           // Required, min 20 chars
  category: string;         // Required, min 2 chars
  order: number;            // Default: 0, must be >= 0
  tags: string[];           // Optional, max 20 items, each min 2 chars
  answer_format: 'text' | 'html' | 'markdown';  // Default: 'text'
  faq_group: string;        // Optional, min 2 chars
  related_cars: ObjectId[]; // References Car model
  related_brands: ObjectId[]; // References Brand model
  related_blogs: ObjectId[]; // References Blog model
  is_published: boolean;    // Default: false
  is_deleted: boolean;      // Default: false
  is_featured: boolean;     // Default: false
  slug: string;             // Required, unique, auto-generated
  view_count: number;       // Default: 0
  createdAt: Date;
  updatedAt: Date;
}
```

### Indexes
- `slug` (unique)
- `category`
- `tags`
- `faq_group`
- `is_published, is_deleted` (compound)
- `question, answer` (text search)
- `is_featured`
- `order`
- `view_count` (descending)

## API Routes

### Public Routes

#### 1. Get All Public FAQs
```
GET /api/faqs/public
GET /api/faqs (legacy, for backward compatibility)
```

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 10) - Items per page
- `category` (string) - Filter by category
- `tag` (string) - Filter by tag
- `faq_group` (string) - Filter by FAQ group
- `is_featured` (boolean) - Filter featured FAQs
- `q` (string) - Search query (searches question and answer)
- `sortBy` (string, default: 'order') - Sort field (order, view_count, createdAt, etc.)
- `sortOrder` (string, default: 'asc') - Sort direction (asc, desc)

**Example:**
```bash
GET /api/faqs/public?page=1&limit=10&category=Pricing&is_featured=true&sortBy=view_count&sortOrder=desc
```

#### 2. Get Public FAQ by ID
```
GET /api/faqs/public/:id
```

**Example:**
```bash
GET /api/faqs/public/123e4567-e89b-12d3-a456-426614174000
```

#### 3. Get FAQs by Group
```
GET /api/faqs/group/:groupName
```

**Example:**
```bash
GET /api/faqs/group/General
```

#### 4. Get Featured FAQs
```
GET /api/faqs/featured
```

**Example:**
```bash
GET /api/faqs/featured
```

#### 5. Get FAQs by Tag
```
GET /api/faqs/tags/:tag
```

**Example:**
```bash
GET /api/faqs/tags/pricing
```

#### 6. Increment View Count
```
PATCH /api/faqs/:id/increment-views
```

**Example:**
```bash
PATCH /api/faqs/123e4567-e89b-12d3-a456-426614174000/increment-views
```

### Admin Routes (Requires Admin/Super Admin Role)

#### 1. Get All FAQs (Admin)
```
GET /api/faqs/admin
```

**Query Parameters:** Same as public routes, plus:
- `is_published` (boolean) - Filter by publish status
- Can include deleted FAQs

**Example:**
```bash
GET /api/faqs/admin?page=1&limit=20&is_published=false
```

#### 2. Get FAQ by ID (Admin)
```
GET /api/faqs/admin/:id
```

**Example:**
```bash
GET /api/faqs/admin/123e4567-e89b-12d3-a456-426614174000
```

#### 3. Delete FAQ (Soft Delete)
```
DELETE /api/faqs/admin/:id
```

**Example:**
```bash
DELETE /api/faqs/admin/123e4567-e89b-12d3-a456-426614174000
```

#### 4. Restore FAQ
```
PATCH /api/faqs/admin/restore/:id
```

**Example:**
```bash
PATCH /api/faqs/admin/restore/123e4567-e89b-12d3-a456-426614174000
```

### Editor Routes (Requires Editor, Admin, or Super Admin Role)

#### 1. Create FAQ
```
POST /api/faqs/editor
```

**Request Body:**
```json
{
  "question": "What is the warranty period?",
  "answer": "All our cars come with a 3-year warranty covering major components.",
  "category": "Warranty",
  "order": 1,
  "tags": ["warranty", "support"],
  "answer_format": "text",
  "faq_group": "General",
  "related_cars": ["car_id_1", "car_id_2"],
  "related_brands": ["brand_id_1"],
  "related_blogs": ["blog_id_1"],
  "is_published": false,
  "is_featured": true
}
```

**Validation Rules:**
- `question`: Required, minimum 10 characters
- `answer`: Required, minimum 20 characters
- `category`: Required, minimum 2 characters
- `order`: Optional, must be >= 0
- `tags`: Optional array, max 20 items, each min 2 characters
- `answer_format`: Optional, must be one of: text, html, markdown
- `faq_group`: Optional, minimum 2 characters
- `is_featured`: Optional, must be boolean

#### 2. Update FAQ
```
PUT /api/faqs/editor/:id
```

**Request Body:** (All fields optional)
```json
{
  "question": "Updated question?",
  "answer": "Updated answer.",
  "category": "Updated Category",
  "order": 2,
  "tags": ["updated-tag"],
  "answer_format": "html",
  "faq_group": "Updated Group",
  "related_cars": ["new_car_id"],
  "related_brands": ["new_brand_id"],
  "related_blogs": ["new_blog_id"],
  "is_published": true,
  "is_featured": false
}
```

**Validation Rules:** Same as create, but all fields are optional

#### 3. Toggle Publish Status
```
PATCH /api/faqs/editor/:id/toggle
```

**Example:**
```bash
PATCH /api/faqs/editor/123e4567-e89b-12d3-a456-426614174000/toggle
```

## Query Examples

### Basic Filtering
```bash
# Get published FAQs in "Pricing" category
GET /api/faqs/public?category=Pricing

# Get featured FAQs
GET /api/faqs/public?is_featured=true

# Get FAQs by group
GET /api/faqs/public?faq_group=General

# Get FAQs by tag
GET /api/faqs/public?tag=warranty
```

### Search
```bash
# Search for FAQs containing "warranty" in question or answer
GET /api/faqs/public?q=warranty

# Combine search with category filter
GET /api/faqs/public?q=engine&category=Technical

# Search with pagination
GET /api/faqs/public?q=battery&page=1&limit=5
```

### Sorting
```bash
# Sort by view count (descending)
GET /api/faqs/public?sortBy=view_count&sortOrder=desc

# Sort by creation date
GET /api/faqs/public?sortBy=createdAt&sortOrder=desc

# Sort by order (ascending - default)
GET /api/faqs/public?sortBy=order&sortOrder=asc
```

### Combined Filters
```bash
# Complex query with multiple filters
GET /api/faqs/public?category=Pricing&is_featured=true&page=1&limit=10&sortBy=view_count&sortOrder=desc

# Search with category and pagination
GET /api/faqs/public?q=insurance&category=Support&page=1&limit=5

# Admin query for unpublished FAQs
GET /api/faqs/admin?is_published=false&page=1&limit=20
```

## Response Format

### Success Response (Single FAQ)
```json
{
  "success": true,
  "message": "FAQ retrieved successfully",
  "data": {
    "faq_id": "123e4567-e89b-12d3-a456-426614174000",
    "question": "What is the warranty period?",
    "answer": "All our cars come with a 3-year warranty...",
    "category": "Warranty",
    "order": 1,
    "tags": ["warranty", "support"],
    "answer_format": "text",
    "faq_group": "General",
    "is_published": true,
    "is_deleted": false,
    "is_featured": true,
    "slug": "what-is-the-warranty-period",
    "view_count": 150,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Success Response (Paginated)
```json
{
  "success": true,
  "message": "FAQs retrieved successfully",
  "data": [
    {
      "faq_id": "123e4567-e89b-12d3-a456-426614174000",
      "question": "What is the warranty period?",
      "answer": "All our cars come with a 3-year warranty...",
      "category": "Warranty",
      "order": 1,
      "tags": ["warranty", "support"],
      "answer_format": "text",
      "faq_group": "General",
      "is_published": true,
      "is_deleted": false,
      "is_featured": true,
      "slug": "what-is-the-warranty-period",
      "view_count": 150,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "itemsPerPage": 10,
    "totalItems": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "FAQ not found",
  "error": "FAQ not found"
}
```

## Validation Errors

```json
{
  "success": false,
  "message": "question must be at least 10 characters long, answer must be at least 20 characters long",
  "error": "question must be at least 10 characters long, answer must be at least 20 characters long"
}
```

## Security Notes

1. **Authentication**: Admin and Editor routes require authentication
2. **Authorization**: Role-based access control (RBAC) enforced
3. **Soft Delete**: FAQs are soft-deleted, preserving data for audit
4. **Atomic Operations**: View count increments use MongoDB's atomic `$inc` operator
5. **Slug Uniqueness**: Slugs are automatically generated and validated for uniqueness
6. **Input Validation**: All inputs are validated before processing

## Performance Considerations

1. **Indexes**: All filter fields are indexed for optimal query performance
2. **Text Search**: Text search uses regex with case-insensitive matching
3. **Pagination**: Pagination prevents large result sets
4. **View Count**: Atomic increments prevent race conditions
5. **Slug Generation**: Unique slug generation checks existing slugs efficiently

## Backward Compatibility

- Legacy route `GET /api/faqs` still works and redirects to public FAQs
- All existing public endpoints remain compatible
- New query parameters are optional and don't break existing clients
