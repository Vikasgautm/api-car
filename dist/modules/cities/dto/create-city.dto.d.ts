export declare class CreateCityDto {
    name: string;
    slug?: string;
    state: string;
    pincode?: number;
    longitude?: number;
    latitude?: number;
    static validate(dto: CreateCityDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=create-city.dto.d.ts.map