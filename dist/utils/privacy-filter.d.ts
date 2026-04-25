/**
 * Privacy Filter - Strips <private> tags from content before storage
 * Based on Claude-Mem's privacy tag feature
 */
/**
 * Strip all <private>...</private> blocks from content
 * Used before persisting to FTS5 or other storage
 */
export declare function stripPrivateTags(content: string): string;
/**
 * Check if content contains private tags (for debugging/validation)
 */
export declare function hasPrivateTags(content: string): boolean;
/**
 * Validate that stripping was successful
 */
export declare function validateClean(content: string): boolean;
//# sourceMappingURL=privacy-filter.d.ts.map