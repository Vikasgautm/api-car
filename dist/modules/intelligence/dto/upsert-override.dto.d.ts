export declare class UpsertBenchmarkOverrideDto {
    weak_max: number;
    average_max: number;
    good_max: number;
    static validate(dto: UpsertBenchmarkOverrideDto): {
        success: boolean;
        error?: {
            errors: {
                message: string;
            }[];
        };
    };
}
