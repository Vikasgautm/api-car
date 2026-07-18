import { cache } from '../utils/cache.util';

function printUsage(): void {
  console.log(`Usage:\n  npm run cache:list\n  npm run cache:clear\n  npm run cache:delete -- --key <key>\n  npm run cache:delete -- --pattern <pattern>\n`);
}

function parseArgs(argv: string[]): { clear?: boolean; delete?: boolean; key?: string; pattern?: string; help?: boolean } {
  const result: { clear?: boolean; delete?: boolean; key?: string; pattern?: string; help?: boolean } = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--clear') result.clear = true;
    else if (arg === '--delete') result.delete = true;
    else if (arg === '--key' && argv[i + 1]) result.key = argv[++i];
    else if (arg === '--pattern' && argv[i + 1]) result.pattern = argv[++i];
    else if (arg === '--help' || arg === '-h') result.help = true;
  }

  return result;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  if (args.clear) {
    cache.clear();
    console.log('All cache entries cleared.');
    console.log(JSON.stringify(cache.debugSnapshot(), null, 2));
    return;
  }

  if (args.delete) {
    if (args.key) {
      cache.delete(args.key);
      console.log(`Deleted key: ${args.key}`);
    } else if (args.pattern) {
      cache.invalidatePattern(args.pattern);
      console.log(`Deleted pattern: ${args.pattern}`);
    } else {
      console.log('Please provide --key or --pattern.');
    }
    console.log(JSON.stringify(cache.debugSnapshot(), null, 2));
    return;
  }

  console.log(JSON.stringify(cache.debugSnapshot(), null, 2));
}

main();
