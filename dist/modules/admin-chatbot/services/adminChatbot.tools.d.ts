import type { ToolResult } from '../types/adminChatbot.types';
export declare function getDashboardSummary(page: number, limit: number): Promise<ToolResult>;
export declare function searchCars(filters: {
    is_published?: boolean;
    is_deleted?: boolean;
    hasMissingBrand?: boolean;
}, page: number, limit: number): Promise<ToolResult>;
export declare function getCarDataQualityReport(page: number, limit: number): Promise<ToolResult>;
export declare function searchVariants(filters: {
    car_name?: string;
    is_published?: boolean;
    is_deleted?: boolean;
    missingPrice?: boolean;
    missingFuelType?: boolean;
    missingBodyType?: boolean;
}, page: number, limit: number): Promise<ToolResult>;
export declare function getVariantDataQualityReport(page: number, limit: number): Promise<ToolResult>;
export declare function getBrandsSummary(page: number, limit: number): Promise<ToolResult>;
export declare function getFuelTypesSummary(page: number, limit: number): Promise<ToolResult>;
export declare function getBodyTypesSummary(page: number, limit: number): Promise<ToolResult>;
export declare function getImportHistory(page: number, limit: number): Promise<ToolResult>;
export declare function getUnmatchedImportKeys(page: number, limit: number): Promise<ToolResult>;
export declare function getBlogsSummary(page: number, limit: number): Promise<ToolResult>;
export declare function getFAQsSummary(page: number, limit: number): Promise<ToolResult>;
export declare function getUsersSummary(page: number, limit: number): Promise<ToolResult>;
export declare function getRecentErrors(page: number, limit: number): Promise<ToolResult>;
export declare function getSystemHealth(page: number, limit: number): Promise<ToolResult>;
//# sourceMappingURL=adminChatbot.tools.d.ts.map