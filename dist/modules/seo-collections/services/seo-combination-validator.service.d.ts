interface InvalidCombo {
    fuel: string;
    body: string;
    reason: string;
}
export declare class SeoCombinationValidatorService {
    static validate(params: {
        fuel_type_slugs?: string[];
        body_type_slugs?: string[];
    }): {
        valid: boolean;
        reason?: string;
    };
    static getInvalidCombos(): InvalidCombo[];
}
export {};
