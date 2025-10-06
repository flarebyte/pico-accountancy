#!/usr/bin/env node

/**
 * Responsibilities:
 * - Node.js CLI entry point for pico-accountancy.
 * - Boots the CLI client and executes requested subcommands.
 */

import { runClient } from './client.js';

await runClient();
