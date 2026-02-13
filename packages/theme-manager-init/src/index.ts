import logger from '@mks2508/better-logger';
import { join } from 'node:path';
import { detectProject, installPackages, verifyCSSImports } from './project-detector.ts';
import { parseCSSVariables } from './css-parser.ts';
import { generateThemeFiles } from './theme-generator.ts';
import { buildRegistry } from './registry-builder.ts';
import { injectFumadocsBridge } from './fumadocs-integrator.ts';
import { injectFOUCScript } from './fouc-injector.ts';

const VERSION = '1.0.0';
const TOTAL_STEPS = 8;

/**
 * Main CLI orchestrator. Runs 8 sequential steps to bootstrap a React+Tailwind
 * project with the Theme Manager system (including FOUC prevention and optional Fumadocs integration).
 */
async function main(): Promise<void> {
  const cwd = process.cwd();

  logger.header('Theme Manager Init', `v${VERSION}`);
  logger.blank();

  // Step 1: Detect project
  logger.step(1, TOTAL_STEPS, 'Detecting project...');
  const spinner1 = logger.spinner('Scanning project structure');
  spinner1.start();

  let project;
  try {
    project = await detectProject(cwd);
    spinner1.succeed(
      `Found ${project.framework} project using ${project.packageManager}` +
        (project.cssFile ? ` (CSS: ${project.cssFile})` : ' (no CSS file found)') +
        (project.hasFumadocs ? ' [Fumadocs detected]' : ''),
    );
  } catch (error) {
    spinner1.fail('Failed to detect project');
    logger.error('Could not read package.json. Are you in a project directory?');
    process.exit(1);
  }

  // Step 2: Parse CSS variables
  logger.step(2, TOTAL_STEPS, 'Parsing CSS variables...');
  const spinner2 = logger.spinner('Reading CSS custom properties');
  spinner2.start();

  let cssResult;
  if (project.cssFile) {
    cssResult = await parseCSSVariables(join(cwd, project.cssFile));
    if (cssResult.hasVariables) {
      spinner2.succeed(
        `Found ${cssResult.lightVars.size} light vars, ${cssResult.darkVars.size} dark vars`,
      );
    } else {
      spinner2.succeed('No :root/:dark variables found (Tailwind v4 @theme inline project)');
    }
  } else {
    cssResult = { hasVariables: false, lightVars: new Map(), darkVars: new Map() };
    spinner2.succeed('No CSS file detected, skipping variable extraction');
  }

  // Step 3: Generate theme CSS files
  logger.step(3, TOTAL_STEPS, 'Generating theme files...');
  const spinner3 = logger.spinner('Copying core themes to public/themes/');
  spinner3.start();

  try {
    spinner3.stop();
    const generated = await generateThemeFiles(cwd, cssResult);
    if (generated === 'declined') {
      spinner3.succeed('Theme generation skipped by user');
    } else {
      spinner3.succeed(`Generated ${generated.length} theme files in public/themes/`);
    }
  } catch (error) {
    spinner3.fail('Failed to generate theme files');
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Could not resolve core theme files: ${msg}`);
    process.exit(1);
  }

  // Step 4: Build registry.json
  logger.step(4, TOTAL_STEPS, 'Building registry...');
  const spinner4 = logger.spinner('Generating public/registry.json');
  spinner4.start();

  spinner4.stop();
  const themeCount = await buildRegistry(cwd, cssResult);
  if (themeCount === 'declined') {
    spinner4.succeed('Registry generation skipped by user');
  } else {
    spinner4.succeed(`Registry created with ${themeCount} themes`);
  }

  // Step 5: Install packages
  logger.step(5, TOTAL_STEPS, 'Checking packages...');
  const spinner5 = logger.spinner('Verifying dependencies');
  spinner5.start();

  try {
    const installed = installPackages(cwd, project);
    if (installed.length > 0) {
      spinner5.succeed(`Installed: ${installed.join(', ')}`);
    } else {
      spinner5.succeed('All required packages already installed');
    }
  } catch (error) {
    spinner5.fail('Package installation failed');
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`Run manually: ${project.packageManager} add @mks2508/shadcn-basecoat-theme-manager @mks2508/theme-manager-react`);
    logger.warn(`Error: ${msg}`);
  }

  // Step 6: FOUC prevention script
  logger.step(6, TOTAL_STEPS, 'Injecting FOUC prevention script...');
  const spinner6 = logger.spinner('FOUC script injection');
  spinner6.start();

  try {
    spinner6.stop();
    const foucResult = await injectFOUCScript(cwd, project);
    if (foucResult === 'injected') {
      const target = project.framework === 'nextjs' ? project.layoutFile : project.htmlEntryPoint;
      spinner6.succeed(`FOUC script injected into ${target}`);
    } else if (foucResult === 'already-present') {
      spinner6.succeed('FOUC prevention script already present');
    } else if (foucResult === 'declined') {
      spinner6.succeed('FOUC injection skipped by user');
    } else {
      spinner6.fail('No HTML entry point or layout file found');
      logger.warn('Add a FOUC prevention script manually. See: https://github.com/MKS2508/theme-manager#fouc-prevention');
    }
  } catch (error) {
    spinner6.fail('Failed to inject FOUC script');
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`FOUC injection error: ${msg}`);
  }

  // Step 7: Fumadocs bridge (conditional)
  logger.step(7, TOTAL_STEPS, 'Checking Fumadocs integration...');
  const spinner7a = logger.spinner('Fumadocs CSS bridge');
  spinner7a.start();

  if (project.hasFumadocs && project.cssFile) {
    try {
      spinner7a.stop();
      const bridgeResult = await injectFumadocsBridge(cwd, project.cssFile);
      if (bridgeResult === 'injected') {
        spinner7a.succeed(`Fumadocs CSS bridge injected into ${project.cssFile}`);
      } else if (bridgeResult === 'already-present') {
        spinner7a.succeed('Fumadocs CSS bridge already present');
      } else if (bridgeResult === 'declined') {
        spinner7a.succeed('Fumadocs bridge skipped by user');
      } else {
        spinner7a.fail('No @theme inline block found for insertion point');
        logger.warn(`Add @theme inline block to ${project.cssFile} first.`);
      }
    } catch (error) {
      spinner7a.fail('Failed to inject Fumadocs bridge');
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`Fumadocs bridge error: ${msg}`);
    }
  } else if (project.hasFumadocs) {
    spinner7a.fail('Fumadocs detected but no CSS file found');
    logger.warn('Create a CSS file with @theme inline before running again.');
  } else {
    spinner7a.succeed('Not a Fumadocs project, skipping');
  }

  // Step 8: Verify CSS config
  logger.step(8, TOTAL_STEPS, 'Verifying CSS configuration...');
  const spinner8 = logger.spinner('Checking @theme inline mappings');
  spinner8.start();

  if (project.cssFile) {
    const hasMapping = await verifyCSSImports(cwd, project.cssFile);
    if (hasMapping) {
      spinner8.succeed('CSS @theme inline configuration verified');
    } else {
      spinner8.fail('Missing --color-background: var(--background) mapping');
      logger.warn(
        `Add @theme inline block to ${project.cssFile} with color variable mappings.`,
      );
      logger.warn(
        'See: https://github.com/MKS2508/theme-manager#css-configuration',
      );
    }
  } else {
    spinner8.fail('No CSS file to verify');
    logger.warn('Create src/index.css with Tailwind v4 @theme inline configuration.');
  }

  // Summary
  logger.blank();

  const displayThemeCount = typeof themeCount === 'number' ? themeCount : 4;

  const baseSummary = [
    `Themes directory:  public/themes/`,
    `Registry:          public/registry.json`,
    `Themes available:  ${displayThemeCount}`,
    `Default theme:     default`,
  ];

  const fumadocsSummary = project.hasFumadocs
    ? [
        '',
        'Fumadocs integration:',
        `  CSS bridge:      ${project.cssFile ?? 'N/A'}`,
        '  Variables:       19 --color-fd-* mappings via var()',
        '  Layout width:    --fd-layout-width: 1400px',
      ]
    : [];

  const usageSummary = [
    '',
    'Usage in your app:',
    '',
    '  import { ThemeProvider } from "@mks2508/theme-manager-react";',
    '',
    '  <ThemeProvider',
    '    registryUrl="/registry.json"',
    '    defaultTheme="default"',
    '    defaultMode="auto"',
    '  >',
    '    <App />',
    '  </ThemeProvider>',
  ];

  const summaryLines = [...baseSummary, ...fumadocsSummary, ...usageSummary].join('\n');

  logger.box(summaryLines, { title: 'Setup Complete', borderColor: 'green' });
}

main().catch((error) => {
  logger.error('Unexpected error:', error);
  process.exit(1);
});
