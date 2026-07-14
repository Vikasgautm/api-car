import { z } from 'zod';
export declare const CreateComparisonDTO: z.ZodObject<{
    car1_id: z.ZodString;
    car2_id: z.ZodString;
    variant1_id: z.ZodOptional<z.ZodString>;
    variant2_id: z.ZodOptional<z.ZodString>;
    slug: z.ZodString;
    title: z.ZodString;
    category: z.ZodOptional<z.ZodEnum<{
        ev: "ev";
        hatchback: "hatchback";
        sedan: "sedan";
        suv: "suv";
        coupe: "coupe";
        mpv: "mpv";
        luxury: "luxury";
        budget: "budget";
        mid_range: "mid_range";
    }>>;
    description: z.ZodOptional<z.ZodString>;
    compareIntroContent: z.ZodOptional<z.ZodString>;
    isPopular: z.ZodDefault<z.ZodBoolean>;
    isTrending: z.ZodDefault<z.ZodBoolean>;
    showOnHomepage: z.ZodDefault<z.ZodBoolean>;
    relatedComparisons: z.ZodOptional<z.ZodArray<z.ZodString>>;
    seoMetaTitle: z.ZodOptional<z.ZodString>;
    seoMetaDescription: z.ZodOptional<z.ZodString>;
    seoFAQSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    status: z.ZodDefault<z.ZodEnum<{
        archived: "archived";
        published: "published";
        draft: "draft";
    }>>;
    is_published: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const UpdateComparisonDTO: z.ZodObject<{
    car1_id: z.ZodOptional<z.ZodString>;
    car2_id: z.ZodOptional<z.ZodString>;
    variant1_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    variant2_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    slug: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        ev: "ev";
        hatchback: "hatchback";
        sedan: "sedan";
        suv: "suv";
        coupe: "coupe";
        mpv: "mpv";
        luxury: "luxury";
        budget: "budget";
        mid_range: "mid_range";
    }>>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    compareIntroContent: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isPopular: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    isTrending: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    showOnHomepage: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    relatedComparisons: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    seoMetaTitle: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    seoMetaDescription: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    seoFAQSchema: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        archived: "archived";
        published: "published";
        draft: "draft";
    }>>>;
    is_published: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const ComparisonQueryDTO: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        archived: "archived";
        published: "published";
        draft: "draft";
    }>>;
    isPopular: z.ZodOptional<z.ZodPreprocess<z.ZodBoolean>>;
    isTrending: z.ZodOptional<z.ZodPreprocess<z.ZodBoolean>>;
    is_deleted: z.ZodDefault<z.ZodPreprocess<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const CreateRivalDTO: z.ZodObject<{
    primary_car_id: z.ZodString;
    rival_car_id: z.ZodString;
    relationship_strength: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const GetRivalsDTO: z.ZodObject<{
    car_id: z.ZodString;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreateComparisonDTOType = z.infer<typeof CreateComparisonDTO>;
export type UpdateComparisonDTOType = z.infer<typeof UpdateComparisonDTO>;
export type ComparisonQueryDTOType = z.infer<typeof ComparisonQueryDTO>;
export type CreateRivalDTOType = z.infer<typeof CreateRivalDTO>;
export type GetRivalsDTOType = z.infer<typeof GetRivalsDTO>;
export declare const createComparisonSchema: z.ZodObject<{
    car1_id: z.ZodString;
    car2_id: z.ZodString;
    variant1_id: z.ZodOptional<z.ZodString>;
    variant2_id: z.ZodOptional<z.ZodString>;
    slug: z.ZodString;
    title: z.ZodString;
    category: z.ZodOptional<z.ZodEnum<{
        ev: "ev";
        hatchback: "hatchback";
        sedan: "sedan";
        suv: "suv";
        coupe: "coupe";
        mpv: "mpv";
        luxury: "luxury";
        budget: "budget";
        mid_range: "mid_range";
    }>>;
    description: z.ZodOptional<z.ZodString>;
    compareIntroContent: z.ZodOptional<z.ZodString>;
    isPopular: z.ZodDefault<z.ZodBoolean>;
    isTrending: z.ZodDefault<z.ZodBoolean>;
    showOnHomepage: z.ZodDefault<z.ZodBoolean>;
    relatedComparisons: z.ZodOptional<z.ZodArray<z.ZodString>>;
    seoMetaTitle: z.ZodOptional<z.ZodString>;
    seoMetaDescription: z.ZodOptional<z.ZodString>;
    seoFAQSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    status: z.ZodDefault<z.ZodEnum<{
        archived: "archived";
        published: "published";
        draft: "draft";
    }>>;
    is_published: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateComparisonSchema: z.ZodObject<{
    car1_id: z.ZodOptional<z.ZodString>;
    car2_id: z.ZodOptional<z.ZodString>;
    variant1_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    variant2_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    slug: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        ev: "ev";
        hatchback: "hatchback";
        sedan: "sedan";
        suv: "suv";
        coupe: "coupe";
        mpv: "mpv";
        luxury: "luxury";
        budget: "budget";
        mid_range: "mid_range";
    }>>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    compareIntroContent: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isPopular: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    isTrending: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    showOnHomepage: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    relatedComparisons: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    seoMetaTitle: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    seoMetaDescription: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    seoFAQSchema: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        archived: "archived";
        published: "published";
        draft: "draft";
    }>>>;
    is_published: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const comparisonQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        archived: "archived";
        published: "published";
        draft: "draft";
    }>>;
    isPopular: z.ZodOptional<z.ZodPreprocess<z.ZodBoolean>>;
    isTrending: z.ZodOptional<z.ZodPreprocess<z.ZodBoolean>>;
    is_deleted: z.ZodDefault<z.ZodPreprocess<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const createRivalSchema: z.ZodObject<{
    primary_car_id: z.ZodString;
    rival_car_id: z.ZodString;
    relationship_strength: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const getRivalsSchema: z.ZodObject<{
    car_id: z.ZodString;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
