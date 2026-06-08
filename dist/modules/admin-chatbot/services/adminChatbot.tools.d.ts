import type { ToolResult, ChatbotWriteAction } from '../types/adminChatbot.types';
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
export declare function searchByCarName(name: string, page: number, limit: number): Promise<ToolResult>;
export declare function searchByVariantName(name: string, carNameOrId: string | undefined, page: number, limit: number): Promise<ToolResult>;
export declare function findCarForAction(name: string, action: ChatbotWriteAction): Promise<ToolResult>;
export declare function findVariantForAction(name: string, action: ChatbotWriteAction): Promise<ToolResult>;
export declare function getCitySummary(page: number, limit: number): Promise<ToolResult>;
export declare function getRankingSummary(page: number, limit: number): Promise<ToolResult>;
export declare function getSeoCollectionSummary(page: number, limit: number): Promise<ToolResult>;
export declare function getPopularCollectionSummary(page: number, limit: number): Promise<ToolResult>;
export declare function performWriteAction(action: ChatbotWriteAction, entity_type: 'car' | 'variant', entity_id: string): Promise<{
    success: boolean;
    message: string;
    entity_name: string;
}>;
//# sourceMappingURL=adminChatbot.tools.d.ts.map