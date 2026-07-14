/**
 * Process scheduled car launches job
 * Runs every 30 minutes to execute any scheduled state transitions
 * that are due
 */
export declare class ProcessScheduledLaunchesJob {
    private static task;
    static start(): void;
    static stop(): void;
    static execute(): Promise<void>;
}
