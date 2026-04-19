/**
 * ZCrystal Plugin Configuration
 *
 * Handles path configuration with environment variable support
 */
export declare const config: {
    paths: {
        home: string;
        openclaw: string;
        data: string;
        skills: string;
        temp: string;
    };
    fts5: {
        mcpUrl: string;
        port: string;
        path: string;
    };
    intervals: {
        evolution: number;
        heartbeat: number;
        proactive: number;
    };
};
export declare function getConfig(key: string): string | number;
//# sourceMappingURL=config.d.ts.map