import * as mongoose from 'mongoose';
import * as path from 'path';
import { CardsManager } from './common/cards/cards-manager';
import { Coordinator } from './coordinator/coordinator';
import { LocalProvider } from './coordinator/nodes/providers/local-provider';
import { LogLevel } from './common/logger/logger';
import { Matchmaker } from './coordinator/matchmaker';
import { PrettyLogger } from './common/logger/pretty-logger';
import { Server } from './coordinator/server';
import parseTimestring = require('timestring');

// Load environment variables from .env file if available
require('dotenv').config();

// Parse settings
const Settings = {
  COORDINATOR_PORT: parseInt(process.env.COORDINATOR_PORT || '8080', 10),
  COORDINATOR_STOP_TIMEOUT: parseTimestring(process.env.COORDINATOR_STOP_TIMEOUT || '30s', 'ms'),
  COORDINATOR_TICK_INTERVAL: parseTimestring(process.env.COORDINATOR_TICK_INTERVAL || '5s', 'ms'),
  DATA_DIR: process.env.DATA_DIR || 'data',
  JWT_ALGORITHMS: (process.env.JWT_ALGORITHMS || 'RS256').split(','),
  JWT_PUBLIC_CERT: process.env.JWT_PUBLIC_CERT || 'certs/jwt.pub',
  LOCAL_PROVIDER_HOST: process.env.LOCAL_PROVIDER_HOST,
  LOG_LEVEL: process.env.LOG_LEVEL || LogLevel.INFO,
  MATCHMAKER_MAX_RANK_DIFFERENCE: parseInt(process.env.MATCHMAKER_MAX_RANK_DIFFERENCE || '500', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost/fftt',
  PROVIDER_MAX_NODES: parseInt(process.env.PROVIDER_MAX_NODES || '10', 10),
  PROVIDER_MIN_PORT: parseInt(process.env.PROVIDER_MIN_PORT || '0', 10),
  PROVIDER_MAX_PORT: parseInt(process.env.PROVIDER_MAX_PORT || '0', 10),
  PROVIDER_NODE_TIMEOUT: parseTimestring(process.env.PROVIDER_NODE_TIMEOUT || '10mins', 'ms'),
};

// Init Logger
if (!(Settings.LOG_LEVEL in LogLevel)) {
  throw new Error(`Invalid value for LOG_LEVEL environment variable: "${Settings.LOG_LEVEL}"`);
}

const logger = new PrettyLogger(Settings.LOG_LEVEL as LogLevel);
logger.info('Main', 'Initializing...');

// Connect to MongoDB
(mongoose as any).Promise = global.Promise;
mongoose.connect(Settings.MONGODB_URI, {useMongoClient: true} as any);
mongoose.connection.on('error', () => {
  logger.error(
    'Main',
    `Could not connect to MongoDB using the following URI: "${Settings.MONGODB_URI}"
  `);
  process.exit(255);
});

// Init node provider, matchmaker, server, coordinator, ...
const cardsManager = new CardsManager(logger);

const nodeProvider = new LocalProvider(logger, {
  host: Settings.LOCAL_PROVIDER_HOST,
  maxNodes: Settings.PROVIDER_MAX_NODES,
  minPort: Settings.PROVIDER_MIN_PORT,
  maxPort: Settings.PROVIDER_MAX_PORT,
  nodeTimeout: Settings.PROVIDER_NODE_TIMEOUT,
  jwtAlgorithms: Settings.JWT_ALGORITHMS,
  jwtPublicCert: Settings.JWT_PUBLIC_CERT,
});

const matchmaker = new Matchmaker(logger, nodeProvider, {
  maxRankDifference: Settings.MATCHMAKER_MAX_RANK_DIFFERENCE,
});

const server = new Server(matchmaker, nodeProvider, cardsManager, logger, {
  port: Settings.COORDINATOR_PORT,
  jwtAlgorithms: Settings.JWT_ALGORITHMS,
  jwtPublicCert: Settings.JWT_PUBLIC_CERT,
});

const coordinator = new Coordinator(logger, nodeProvider, matchmaker, server, {
  tickInterval: Settings.COORDINATOR_TICK_INTERVAL,
  stopTimeout: Settings.COORDINATOR_STOP_TIMEOUT,
});

// Load data and boot coordinator
new Promise(async () => {
  try {
    await cardsManager.load(path.join(Settings.DATA_DIR, 'cards.json'));
    await coordinator.start();
  } catch (e) {
    logger.error('Main', 'Could not start server: ', e);
    process.exit(255);
  }
}).then(() => {
  logger.info('Main', 'Server is now running');
});

// Catch stop signals
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
