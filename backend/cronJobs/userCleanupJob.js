import cron from "node-cron";
import User from "../DB/models/userModel.js";

export const startUserCleanupJob = () => {
    cron.schedule("0 1 * * *", async () => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const result = await User.deleteMany({
            verified: false,
            createdAt: { $lt: oneHourAgo }
        });
        if (result.deletedCount > 0) {
            console.log(`Deleted ${result.deletedCount} users`);
        }
    });
};
