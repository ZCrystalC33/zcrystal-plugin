/**
 * ZCrystal Onboarding Wizard
 * Guides users through complete system setup
 */
export interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    validate: () => Promise<{
        ok: boolean;
        message: string;
    }>;
    fix?: () => Promise<boolean>;
}
export declare class OnboardingWizard {
    private steps;
    constructor();
    private initSteps;
    run(): Promise<{
        success: boolean;
        report: string;
    }>;
    private getSystemSummary;
}
export declare function getQuickStatus(): Promise<string>;
//# sourceMappingURL=onboarding-wizard.d.ts.map