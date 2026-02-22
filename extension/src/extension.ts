import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const ZENDOC_PROFILE = 'Zendoc';
const REQUIRED_EXTENSIONS = [
  'vsls-contrib.gitdoc',
  'yzhang.markdown-all-in-one',
  'concretio.markdown-for-humans',
];

let outputChannel: vscode.OutputChannel;

function log(message: string): void {
  outputChannel?.appendLine(`[Zendoc] ${message}`);
}

function getCliPath(): string {
  const execPath = process.execPath;
  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  if (isMac) {
    const execDir = path.dirname(execPath);
    const cursorPath = path.join(execDir, '..', '..', '..', '..', 'Resources', 'app', 'bin', 'cursor');
    const codePath = path.join(execDir, '..', '..', '..', '..', 'Resources', 'app', 'bin', 'code');
    if (fs.existsSync(cursorPath)) return cursorPath;
    if (fs.existsSync(codePath)) return codePath;
  }
  if (isWindows) {
    const binDir = path.join(path.dirname(execPath), 'bin');
    const cursorPath = path.join(binDir, 'cursor.cmd');
    const codePath = path.join(binDir, 'code.cmd');
    if (fs.existsSync(cursorPath)) return cursorPath;
    if (fs.existsSync(codePath)) return codePath;
  }

  return process.env.CURSOR ? 'cursor' : 'code';
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

async function runCommand(cmd: string, cwd?: string): Promise<{ stdout: string; stderr: string }> {
  log(`Running: ${cmd}`);
  try {
    const result = await execAsync(cmd, { cwd });
    if (result.stdout) log(`stdout: ${result.stdout.trim()}`);
    if (result.stderr) log(`stderr: ${result.stderr.trim()}`);
    return result;
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string };
    const msg = err.stderr || err.stdout || String(error);
    log(`Error: ${msg}`);
    throw new Error(msg);
  }
}

async function isGhInstalled(): Promise<boolean> {
  try {
    await execAsync('gh --version');
    return true;
  } catch {
    return false;
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('[Zendoc] activate() called');
  try {
    outputChannel = vscode.window.createOutputChannel('Zendoc');
    context.subscriptions.push(outputChannel);
    log('Zendoc extension activated');

  const createWorkspace = vscode.commands.registerCommand(
    'zendoc.createWorkspace',
    async () => {
      try {
        outputChannel.show();
        log('Starting Create Workspace wizard...');

        const folderUris = await vscode.window.showOpenDialog({
          canSelectFolders: true,
          canSelectMany: false,
          title: 'Choose where to create your Zendoc workspace',
          openLabel: 'Select Folder',
        });

        if (!folderUris || folderUris.length === 0) {
          log('User cancelled folder selection');
          return;
        }

        const parentPath = folderUris[0].fsPath;
        const workspaceName = await vscode.window.showInputBox({
          prompt: 'Name your workspace',
          value: 'zendoc',
          validateInput: (value) => {
            if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
              return 'Use only letters, numbers, hyphens, and underscores';
            }
            return null;
          },
        });

        if (!workspaceName) {
          log('User cancelled workspace name');
          return;
        }

        const workspacePath = path.join(parentPath, workspaceName);
        if (fs.existsSync(workspacePath)) {
          vscode.window.showErrorMessage(`Folder already exists: ${workspacePath}`);
          return;
        }

        vscode.window.showInformationMessage('Creating workspace...');
        log('Copying template...');

        const templatePath = path.join(context.extensionPath, 'resources', 'template');
        await copyDir(templatePath, workspacePath);

        await runCommand('git init', workspacePath);
        log('Git initialized');

        // GitHub setup skipped for now (use zendoc.setupBackup command later if needed)
        log('GitHub setup skipped');

        const cliPath = getCliPath();
        const cliExists = cliPath.includes('/') ? fs.existsSync(cliPath) : true;
        log(`Using CLI: ${cliPath} (exists: ${cliExists})`);

        vscode.window.showInformationMessage('Installing extensions and opening workspace...');

        // 1. Create profile + install extensions first (profile created by opening; extensions must exist before folder opens)
        exec(`"${cliPath}" --profile "${ZENDOC_PROFILE}"`, (err) => {
          if (err) log(`Profile creation: ${err}`);
        });
        await new Promise((resolve) => setTimeout(resolve, 4000));

        for (const extId of REQUIRED_EXTENSIONS) {
          try {
            await runCommand(`"${cliPath}" --install-extension ${extId} --profile "${ZENDOC_PROFILE}"`);
            log(`Installed: ${extId}`);
          } catch (err) {
            log(`Failed to install ${extId}: ${err}`);
            vscode.window.showWarningMessage(
              `Could not install ${extId}. Install it manually from the Extensions panel.`,
              'Show Extensions'
            ).then((choice) => {
              if (choice === 'Show Extensions') {
                vscode.commands.executeCommand('workbench.view.extensions');
              }
            });
          }
        }

        // 2. Open FOLDER in same window - replaces empty view; folder open shows Explorer by default
        vscode.window.showInformationMessage('Opening workspace...');
        exec(`"${cliPath}" "${workspacePath}" --profile "${ZENDOC_PROFILE}" --reuse-window`, (err) => {
          if (err) {
            log(`Open failed: ${err}`);
            vscode.window.showInformationMessage(
              `Workspace created at ${workspacePath}. Open it manually with File > Open Folder.`
            );
          }
        });

        vscode.window.showInformationMessage('Your workspace is ready. A new window will open—check Welcome.md to get started.');
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        log(`Fatal error: ${msg}`);
        vscode.window.showErrorMessage(`Zendoc setup failed: ${msg}`);
      }
    }
  );

  const setupBackup = vscode.commands.registerCommand(
    'zendoc.setupBackup',
    async (workspacePath?: string) => {
      const targetPath = workspacePath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!targetPath) {
        vscode.window.showErrorMessage('Open a Zendoc workspace first, or run Create workspace.');
        return;
      }

      const ghInstalled = await isGhInstalled();
      if (!ghInstalled) {
        vscode.window.showErrorMessage(
          'GitHub CLI (gh) is required. Install it with: brew install gh'
        );
        return;
      }

      outputChannel?.show();
      log('Starting GitHub setup...');

      try {
        const connect = await vscode.window.showInformationMessage(
          'Your browser will open. Sign in to GitHub, then return here.',
          'Connect GitHub',
          'Cancel'
        );
        if (connect !== 'Connect GitHub') return;

        await runCommand('gh auth login --web', targetPath);
        const workspaceName = path.basename(targetPath);
        await runCommand(
          `gh repo create ${workspaceName} --private --source=. --push`,
          targetPath
        );
        vscode.window.showInformationMessage('Your work backs up to GitHub automatically.');
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        log(`GitHub setup failed: ${msg}`);
        vscode.window.showErrorMessage(`GitHub setup failed: ${msg}`);
      }
    }
  );

  context.subscriptions.push(createWorkspace, setupBackup);

  // TODO: Restore "show once" logic when done testing
  // const hasShownWelcome = context.globalState.get<boolean>('zendoc.welcomeShown');
  // if (!hasShownWelcome) {
  //   context.globalState.update('zendoc.welcomeShown', true);
  log('Showing welcome notification');
  vscode.window
    .showInformationMessage('Create your Zendoc workspace', 'Create workspace')
    .then((choice) => {
      if (choice === 'Create workspace') {
        vscode.commands.executeCommand('zendoc.createWorkspace');
      }
    });
  // }
  } catch (err) {
    console.error('[Zendoc] Activation failed:', err);
    if (outputChannel) {
      outputChannel.appendLine(`Activation error: ${err}`);
    }
  }
}

export function deactivate() {}
