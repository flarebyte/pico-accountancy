import { strict as assert } from 'node:assert';
import test from 'node:test';

import { Command } from 'commander';
import jetpack from 'fs-jetpack';
import moment from 'moment';
import { z } from 'zod';

test('commander: parses simple option', () => {
  const program = new Command();
  program.exitOverride();
  program.allowUnknownOption();
  program.option('--name <name>');
  program.parse(['node', 'cli', '--name', 'demo'], { from: 'user' });
  const opts = program.opts<{ name?: string }>();
  assert.equal(opts.name, 'demo');
});

test('fs-jetpack: can write and read a file in tmp dir', () => {
  const dir = jetpack.tmpDir();
  const filename = 'smoke.txt';
  const content = 'hello world';
  dir.write(filename, content);
  const readBack = dir.read(filename);
  assert.equal(readBack, content);
});

test('moment: parses and formats a date', () => {
  const m = moment('2024-03-01', 'YYYY-MM-DD');
  assert.equal(m.format('YYYY-MM-DD'), '2024-03-01');
});

test('zod: validates a simple object', () => {
  const schema = z.object({ a: z.number() });
  const result = schema.safeParse({ a: 1 });
  assert.equal(result.success, true);
});
