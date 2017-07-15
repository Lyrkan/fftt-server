import { Coordinator } from './coordinator/coordinator';
import { LocalProvider } from './coordinator/nodes/providers/local-provider';
import { Logger, LogLevel } from './common/services/logger';

const logger = new Logger(LogLevel.DEBUG);

logger.info('Main', 'Initializing...');

const nodeProvider = new LocalProvider(logger, {
  maxNodes: 10,
  minPort: 9000,
  maxPort: 9200,
});

const coordinator = new Coordinator(logger, nodeProvider);

coordinator.start();

process.on('SIGINT', async () => {
  logger.info('Main', 'Received SIGINT, stopping coordinator...');

  try {
    await coordinator.stop();
    process.exit(0);
  } catch (e) {
    logger.error('Main', 'Could not stop coordinator (timeout)');
    process.exit(255);
  }
});
