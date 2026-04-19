/**
 * ZCrystal Onboarding Wizard
 * 
 * Interactive setup wizard for first-time users
 */

import * as readline from 'node:readline';
import { existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const HOME = homedir();
const DEFAULT_OPENCLAW_PATH = join(HOME, '.openclaw');
const DEFAULT_DATA_PATH = join(DEFAULT_OPENCLAW_PATH, 'extensions', 'zcrystal');

interface WizardAnswers {
  openclawPath: string;
  dataPath: string;
  fts5Port: string;
  evolutionInterval: number;
  heartbeatInterval: number;
  proactiveInterval: number;
  autoStart: boolean;
  enableFTS5: boolean;
}

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function printHeader(text: string): void {
  console.log('\n' + colors.blue + '='.repeat(50) + colors.reset);
  console.log(colors.bright + text + colors.reset);
  console.log(colors.blue + '='.repeat(50) + colors.reset + '\n');
}

function printStep(step: number, total: number, text: string): void {
  console.log(colors.green + `[${step}/${total}]` + colors.reset + ' ' + text);
}

function printSuccess(text: string): void {
  console.log(colors.green + '✓' + colors.reset + ' ' + text);
}

function printWarning(text: string): void {
  console.log(colors.yellow + '!' + colors.reset + ' ' + text);
}

async function detectOpenClaw(): Promise<string> {
  const paths = [
    join(HOME, '.openclaw'),
    '/root/.openclaw',
    '/home/openclaw/.openclaw',
  ];

  for (const path of paths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return DEFAULT_OPENCLAW_PATH;
}

async function askOpenClawPath(): Promise<string> {
  const detected = await detectOpenClaw();
  printWarning(`Detected OpenClaw at: ${detected}`);

  const answer = await question('Enter OpenClaw path (or press Enter for default): ');
  return answer.trim() || detected;
}

async function askDataPath(): Promise<string> {
  const defaultPath = join(DEFAULT_DATA_PATH);
  const answer = await question(`Enter ZCrystal data path (or press Enter for default): `);
  return answer.trim() || defaultPath;
}

async function askFTS5Port(): Promise<string> {
  const answer = await question('Enter FTS5 MCP port (default: 18795): ');
  return answer.trim() || '18795';
}

async function askEvolutionInterval(): Promise<number> {
  printWarning('Evolution runs automatically every 60 minutes by default');
  const answer = await question('Evolution interval in minutes (default: 60): ');
  const minutes = parseInt(answer.trim()) || 60;
  return minutes * 60 * 1000; // Convert to milliseconds
}

async function askHeartbeatInterval(): Promise<number> {
  printWarning('Heartbeat checks run every 5 minutes by default');
  const answer = await question('Heartbeat interval in minutes (default: 5): ');
  const minutes = parseInt(answer.trim()) || 5;
  return minutes * 60 * 1000;
}

async function askProactiveInterval(): Promise<number> {
  printWarning('Proactive checks run every 10 minutes by default');
  const answer = await question('Proactive check interval in minutes (default: 10): ');
  const minutes = parseInt(answer.trim()) || 10;
  return minutes * 60 * 1000;
}

async function askAutoStart(): Promise<boolean> {
  const answer = await question('Enable auto-evolution on startup? (y/N): ');
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

async function askEnableFTS5(): Promise<boolean> {
  const answer = await question('Enable FTS5 search integration? (Y/n): ');
  return answer.toLowerCase() !== 'n' && answer.toLowerCase() !== 'no';
}

async function createConfigFile(answers: WizardAnswers): Promise<void> {
  const configPath = join(answers.openclawPath, 'extensions', 'zcrystal', 'config.json');

  const config = {
    version: '0.7.0',
    paths: {
      openclaw: answers.openclawPath,
      data: answers.dataPath,
      skills: join(answers.openclawPath, 'skills'),
      temp: '/tmp/zcrystal',
    },
    fts5: {
      mcpUrl: `http://localhost:${answers.fts5Port}/mcp`,
      port: answers.fts5Port,
      path: join(answers.openclawPath, 'skills', 'fts5'),
      enabled: answers.enableFTS5,
    },
    intervals: {
      evolution: answers.evolutionInterval,
      heartbeat: answers.heartbeatInterval,
      proactive: answers.proactiveInterval,
    },
    autoStart: {
      evolution: answers.autoStart,
    },
    createdAt: new Date().toISOString(),
  };

  // Ensure directory exists
  const dir = join(answers.dataPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2));
  printSuccess(`Configuration saved to: ${configPath}`);
}

async function createEnvFile(answers: WizardAnswers): Promise<void> {
  const envPath = join(answers.openclawPath, '.env');

  const envContent = `
# ZCrystal Plugin Configuration
ZCRYSTAL_DATA_PATH=${answers.dataPath}
ZCRYSTAL_SKILLS_PATH=${join(answers.openclawPath, 'skills')}
ZCRYSTAL_FTS5_PORT=${answers.fts5Port}
ZCRYSTAL_EVOLUTION_INTERVAL=${answers.evolutionInterval}
ZCRYSTAL_HEARTBEAT_INTERVAL=${answers.heartbeatInterval}
ZCRYSTAL_PROACTIVE_INTERVAL=${answers.proactiveInterval}
`.trim();

  if (existsSync(envPath)) {
    if (!envContent.split('\n').every(line => line.includes('ZCRYSTAL'))) {
      appendFileSync(envPath, '\n' + envContent);
    }
    printSuccess('Environment variables appended to: ' + envPath);
  } else {
    writeFileSync(envPath, envContent + '\n');
    printSuccess('Environment variables saved to: ' + envPath);
  }
}

export async function runOnboarding(): Promise<void> {
  printHeader('ZCrystal Plugin - Onboarding Wizard');

  console.log('This wizard will help you configure ZCrystal Plugin.\n');

  try {
    // Step 1: OpenClaw path
    printStep(1, 8, 'OpenClaw Installation Path');
    const openclawPath = await askOpenClawPath();

    // Step 2: Data path
    printStep(2, 8, 'ZCrystal Data Directory');
    const dataPath = await askDataPath();

    // Step 3: FTS5 Port
    printStep(3, 8, 'FTS5 MCP Server Port');
    const fts5Port = await askFTS5Port();

    // Step 4: Evolution interval
    printStep(4, 8, 'Evolution Schedule');
    const evolutionInterval = await askEvolutionInterval();

    // Step 5: Heartbeat interval
    printStep(5, 8, 'Heartbeat Schedule');
    const heartbeatInterval = await askHeartbeatInterval();

    // Step 6: Proactive interval
    printStep(6, 8, 'Proactive Check Schedule');
    const proactiveInterval = await askProactiveInterval();

    // Step 7: Auto-start
    printStep(7, 8, 'Startup Options');
    const autoStart = await askAutoStart();

    // Step 8: FTS5
    printStep(8, 8, 'FTS5 Integration');
    const enableFTS5 = await askEnableFTS5();

    // Create configuration
    const answers: WizardAnswers = {
      openclawPath,
      dataPath,
      fts5Port,
      evolutionInterval,
      heartbeatInterval,
      proactiveInterval,
      autoStart,
      enableFTS5,
    };

    console.log('\n' + colors.blue + '-'.repeat(50) + colors.reset);
    console.log('Creating configuration files...');

    await createConfigFile(answers);
    await createEnvFile(answers);

    // Summary
    console.log('\n' + colors.green + '✓ Configuration complete!' + colors.reset + '\n');
    console.log('Summary:');
    console.log('  OpenClaw Path:      ' + openclawPath);
    console.log('  Data Path:          ' + dataPath);
    console.log('  FTS5 Port:           ' + fts5Port);
    console.log('  Evolution Interval:  ' + (evolutionInterval / 60000) + ' minutes');
    console.log('  Heartbeat Interval:  ' + (heartbeatInterval / 60000) + ' minutes');
    console.log('  Proactive Interval:  ' + (proactiveInterval / 60000) + ' minutes');
    console.log('  Auto-start:          ' + (autoStart ? 'Yes' : 'No'));
    console.log('  FTS5 Enabled:        ' + (enableFTS5 ? 'Yes' : 'No'));
    console.log('');

    console.log('Next steps:');
    console.log('  1. Restart OpenClaw to load the plugin');
    console.log('  2. Run: zcrystal_evo_health to check status');
    console.log('');

  } catch (error) {
    console.error(colors.red + 'Onboarding failed:', error + colors.reset);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runOnboarding().catch(console.error);
}
