import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';

// Always create a fresh loopback-only PostgreSQL cluster; never read a database URL.
const directory = mkdtempSync(join(tmpdir(), 'goldgeek-test-'));
const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
await new Promise((resolve) => server.close(resolve));
const env = { ...process.env, DATABASE_URL: `postgresql://${encodeURIComponent(userInfo().username)}@127.0.0.1:${port}/postgres`, NODE_ENV: 'test' };
env.RESEND_API_KEY = '';
env.FEDEX_CLIENT_ID = '';
env.FEDEX_CLIENT_SECRET = '';
env.DATABASE_POOL_SIZE = '8';
env.FEDEX_SANDBOX_MODE = 'true';
env.PAYMENT_DATA_KEY = randomBytes(32).toString('hex');
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { env, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status}): ${result.stderr?.toString() || ''}`);
}
let started = false;
try {
  run('initdb', ['-D', directory, '--auth=trust', '--no-locale', '--encoding=UTF8'], { stdio: 'pipe' });
  run('pg_ctl', ['-D', directory, '-l', join(directory, 'server.log'), '-o', `-h 127.0.0.1 -p ${port} -k ''`, '-w', 'start'], { stdio: 'pipe' });
  started = true;
  const requested = process.argv.slice(2);
  const files = requested.length ? requested : readdirSync('tests').filter((file) => file.endsWith('.test.ts')).map((file) => `tests/${file}`);
  for (const [index, file] of files.entries()) {
    const database = `goldgeek_test_${index}`;
    run('createdb', ['-h', '127.0.0.1', '-p', String(port), database], { stdio: 'pipe' });
    const databaseUrl = new URL(env.DATABASE_URL);
    databaseUrl.pathname = `/${database}`;
    env.DATABASE_URL = databaseUrl.toString();
    run('npx', ['prisma', 'migrate', 'deploy'], { stdio: 'pipe' });
    run(process.execPath, ['--import', 'tsx', '--test', file]);
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
} finally {
  if (started) run('pg_ctl', ['-D', directory, '-m', 'fast', '-w', 'stop'], { stdio: 'pipe' });
  if (!process.exitCode && process.env.KEEP_TEST_DATABASE !== '1') rmSync(directory, { recursive: true });
}
