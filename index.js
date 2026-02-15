import { app } from "./src/app.js";
import 'dotenv/config'; 
import redis from './src/config/redis.js';
import dbInstance from './src/config/db.js';
import kafkaInstance from "./src/config/kafka.js";
import { logger } from "./src/utils/logger.js";
import runAuthConsumer from './src/workers/auth.worker.js';
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        dbInstance.connect().catch((err) => {
            logger.error("Initial MongoDB connection failed. Retrying...");
        });

        redis.on('ready', () => logger.info("Infrastructure: Redis is ready."));

    
        await kafkaInstance.connectProducer();
        logger.info('Infrastructure: Kafka Producer initialized');
        await runAuthConsumer();
        logger.info("Email Worker is active and waiting for events...");

        app.listen(PORT, () => {
            logger.info(`Service ONLINE | Port: ${PORT} | Mode: ${process.env.NODE_ENV}`);
        });

    } catch (error) {
        logger.fatal({ error }, "Failed to start Infrastructure");
        process.exit(1);
    }
};

process.on('unhandledRejection', (reason, promise) => {
    logger.error({ promise, reason }, 'Unhandled Rejection at Promise');
});

startServer();