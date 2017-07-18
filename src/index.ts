import * as mongoose from 'mongoose';
import { Coordinator } from './coordinator/coordinator';
import { NodeProvider } from './coordinator/nodes/node-provider';
import { LocalProvider, LocalNodeConfiguration } from './coordinator/nodes/providers/local-provider';
import { Logger, LogLevel } from './common/services/logger';

// Load environment variables from .env file if available
require('dotenv').config();

// Init Logger
const logLevel = process.env.LOG_LEVEL || LogLevel.INFO;
if (!(logLevel in LogLevel)) {
  throw new Error(`Invalid value for LOG_LEVEL environment variable: "${logLevel}"`);
}
const logger = new Logger(logLevel as LogLevel);

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/fftt';
mongoose.connect(mongoURI, {useMongoClient: true} as any);
mongoose.connection.on('error', () => {
  logger.error('Main', `Could not connect to MongoDB using the following URI: "${mongoURI}"`);
  process.exit(255);
});

// Init node provider and coordinator
logger.info('Main', 'Initializing...');

const nodeProvider: NodeProvider<any, LocalNodeConfiguration> = new LocalProvider(
  logger,
  {
    maxNodes: parseInt(process.env.PROVIDER_MAX_NODES || '10', 10),
    minPort: parseInt(process.env.PROVIDER_MIN_PORT || '9000', 10),
    maxPort: parseInt(process.env.PROVIDER_MAX_PORT || '9999', 10),
    host: process.env.LOCAL_PROVIDER_HOST,
    jwtPublicCert: process.env.JWT_PUBLIC_CERT || 'certs/jwt.pub',
  }
);

const coordinator = new Coordinator(
  logger,
  nodeProvider,
  {
    port: parseInt(process.env.COORDINATOR_PORT || '8080', 10),
    jwtPublicCert: process.env.JWT_PUBLIC_CERT || 'certs/jwt.pub',
    tickInterval: parseInt(process.env.COORDINATOR_TICK_INTERVAL || '5000', 10),
    stopTimeout: parseInt(process.env.COORDINATOR_STOP_TIMEOUT || '30000', 10),
  }
);

// Start coordinator
coordinator.start();

process.on('SIGINT', async () => {
  logger.info('Main', 'Received SIGINT, stopping coordinator...');

  try {
    await coordinator.stop();
    process.exit(0);
  } catch (e) {
    logger.error('Main', 'Could not stop coordinator: ', e);
    process.exit(255);
  }
});
