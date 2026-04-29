export declare class UpdateCityDto {
    name?: string;
    slug?: string;
    state?: string;
    pincode?: number;
    longitude?: number;
    latitude?: number;
    static validate(dto: UpdateCityDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=update-city.dto.d.ts.map