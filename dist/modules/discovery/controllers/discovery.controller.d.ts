import { Request, Response } from 'express';
export declare class DiscoveryController {
    static discover: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    /**
     * Same shape as `discover` but also surfaces the facets payload — useful for
     * the discovery sidebar. Kept separate so the public list endpoint can avoid
     * paying the facet cost if it doesn't need it.
     */
    static discoverWithFacets: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    /** Pure count, used by SEO preset preview. */
    static count: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=discovery.controller.d.ts.map