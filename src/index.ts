import * as mongoose from 'mongoose';
import { Coordinator } from './coordinator/coordinator';
import { LocalProvider } from './coordinator/nodes/providers/local-provider';
import { LogLevel } from './common/logger/logger';
import { Matchmaker } from './coordinator/matchmaker';
import { PrettyLogger } from './common/logger/pretty-logger';
import { Server } from './coordinator/server';
import parseTimestring = require('timestring');

// Load environment variables from .env file if available
require('dotenv').config();

// Init Logger
const logLevel = process.env.LOG_LEVEL || LogLevel.INFO;
if (!(logLevel in LogLevel)) {
  throw new Error(`Invalid value for LOG_LEVEL environment variable: "${logLevel}"`);
}
const logger = new PrettyLogger(logLevel as LogLevel);

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/fftt';
mongoose.connect(mongoURI, {useMongoClient: true} as any);
mongoose.connection.on('error', () => {
  logger.error('Main', `Could not connect to MongoDB using the following URI: "${mongoURI}"`);
  process.exit(255);
});

// Init node provider, matchmaker, server and coordinator
logger.info('Main', 'Initializing...');

const nodeProvider = new LocalProvider(
  logger,
  {
    maxNodes: parseInt(process.env.PROVIDER_MAX_NODES || '10', 10),
    minPort: parseInt(process.env.PROVIDER_MIN_PORT || '0', 10),
    maxPort: parseInt(process.env.PROVIDER_MAX_PORT || '0', 10),
    nodeTimeout: parseTimestring(process.env.PROVIDER_NODE_TIMEOUT || '10mins', 'ms'),
    host: process.env.LOCAL_PROVIDER_HOST,
    jwtPublicCert: process.env.JWT_PUBLIC_CERT || 'certs/jwt.pub',
  }
);

const matchmaker = new Matchmaker(
  logger,
  nodeProvider,
  {
    maxRankDifference: parseInt(process.env.MATCHMAKER_MAX_RANK_DIFFERENCE || '500', 10),
  }
);

const server = new Server(
  logger,
  matchmaker,
  nodeProvider,
  {
    port: parseInt(process.env.COORDINATOR_PORT || '8080', 10),
    jwtPublicCert: process.env.JWT_PUBLIC_CERT || 'certs/jwt.pub',
  }
);

const coordinator = new Coordinator(
  logger,
  nodeProvider,
  matchmaker,
  server,
  {
    tickInterval: parseTimestring(process.env.COORDINATOR_TICK_INTERVAL || '5secs', 'ms'),
    stopTimeout: parseTimestring(process.env.COORDINATOR_STOP_TIMEOUT || '30secs', 'ms'),
  },
);

// Start coordinator
coordinator.start().then(() => {
  logger.info('Main', 'Coordinator is now running');
}).catch(e => {
  logger.error('Main', `Could not start server: `, e);
  process.exit(255);
});

function onStopSignal(signal: string) {
  return async () => {
    logger.info('Main', `Received "${signal}" signal, stopping coordinator...`);

    try {
      await coordinator.stop();
      process.exit(0);
    } catch (e) {
      logger.error('Main', 'Could not stop coordinator: ', e);
      process.exit(255);
    }
  };
}

process.on('SIGINT', onStopSignal('SIGINT'));
process.on('SIGTERM', onStopSignal('SIGTERM'));
