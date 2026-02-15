import kafkaInstance from '../config/kafka.js';
import { sendWelcomeEmail } from '../utils/mail.util.js';
import { logger } from '../utils/logger.js';

const runAuthConsumer = async () => {
    const consumer = kafkaInstance.kafka.consumer({ groupId: 'auth-service-group' });

    await consumer.connect();
    await consumer.subscribe({ topic: 'auth-events', fromBeginning: false });

    logger.info(" Kafka Consumer: Listening for auth-events...");

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const rawData = message.value.toString();
                const event = JSON.parse(rawData);

                logger.info(`Kafka Event Received: ${event.type} for ${event.email}`);

                if (event.type === 'SEND_WELCOME_EMAIL') {
                    await sendWelcomeEmail(event.email);
                    logger.info(`Welcome email dispatched to ${event.email}`);
                }
            } catch (error) {
                logger.error({ error: error.message }, "Kafka Consumer Error processing message");
            }
        },
    });
};

export default runAuthConsumer;