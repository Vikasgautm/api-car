/**
 * Auto-launch job for upcoming cars
 * Runs daily at midnight to move upcoming cars to launched status
 * when their expected_launch_date has passed
 */
export declare class UpdateUpcomingCarsJob {
    private static task;
    static start(): void;
    static stop(): void;
    static execute(): Promise<void>;
}
//# sourceMappingURL=updateUpcomingCars.job.d.ts.map