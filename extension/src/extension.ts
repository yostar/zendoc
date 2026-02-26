import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const ZENDOC_PROFILE = 'Zendoc';
const ZENDOC_BOT_USERNAME = 'ZendocBot';
const REQUIRED_EXTENSIONS = [
  'YMSDynamics.yms-zendoc',
  'vsls-contrib.gitdoc',
  'yzhang.markdown-all-in-one',
  'concretio.markdown-for-humans',
];

let outputChannel: vscode.OutputChannel;
let welcomePanelToCloseOnCreate: vscode.WebviewPanel | undefined;
let hasShownSessionWelcome = false;

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

function isXcodeSelectError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /invalid active developer path|xcrun|Xcode/i.test(msg);
}

async function checkGitAvailable(): Promise<boolean> {
  const tmpDir = path.join(os.tmpdir(), `zendoc-git-check-${Date.now()}`);
  try {
    await fs.promises.mkdir(tmpDir, { recursive: true });
    await execAsync('git init', { cwd: tmpDir, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
    return true;
  } catch {
    return false;
  } finally {
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

function runXcodeSelectInstall(): void {
  spawn('xcode-select', ['--install'], { stdio: 'ignore', detached: true }).unref();
}

function openWorkspaceInZendocProfile(workspacePath: string): void {
  const cliPath = getCliPath();
  log(`Opening ${workspacePath} in ${ZENDOC_PROFILE} profile`);
  const proc = spawn(cliPath, [workspacePath, '--profile', ZENDOC_PROFILE], {
    stdio: 'ignore',
    detached: true,
    env: process.env,
  });
  proc.unref();
  proc.on('error', (err) => {
    log(`Failed to open workspace: ${err.message}`);
    vscode.window.showErrorMessage(`Could not open Zendoc window: ${err.message}`);
  });
}

function showWorkspaceReadyPanel(workspacePath: string): void {
  const panel = vscode.window.createWebviewPanel(
    'zendoc.workspaceReady',
    'Zendoc workspace ready',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );
  panel.webview.html = getWorkspaceReadyHtml();
  panel.webview.onDidReceiveMessage((message: { type: string }) => {
    if (message.type === 'openWorkspace') {
      openWorkspaceInZendocProfile(workspacePath);
      panel.dispose();
    }
  });
}

function getWorkspaceReadyHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: 14px;
      padding: 32px;
      color: var(--vscode-foreground);
      line-height: 1.6;
      text-align: center;
    }
    h2 { margin-top: 0; }
    p { margin: 16px 0; color: var(--vscode-descriptionForeground); }
    button {
      padding: 14px 28px;
      font-size: 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      cursor: pointer;
      margin-top: 8px;
    }
    button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <h2>Your Zendoc workspace is ready</h2>
  <p>A new window may have opened. If not, click below to open your writing space.</p>
  <button id="open">Open Zendoc</button>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('open').onclick = () => {
      vscode.postMessage({ type: 'openWorkspace' });
    };
  </script>
</body>
</html>`;
}

function getWelcomePanelHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: 14px;
      padding: 24px;
      color: var(--vscode-foreground);
      line-height: 1.6;
    }
    h2 { margin-top: 0; }
    p { margin: 12px 0; color: var(--vscode-descriptionForeground); }
    button {
      padding: 12px 24px;
      font-size: 14px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      cursor: pointer;
      margin-top: 8px;
    }
    button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <h2>Welcome to Zendoc</h2>
  <p>A writing environment with GitHub backup. Create a workspace to get started.</p>
  <button id="create">Create workspace</button>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('create').onclick = () => {
      vscode.postMessage({ type: 'createWorkspace' });
    };
  </script>
</body>
</html>`;
}

function showWelcomePanel(context: vscode.ExtensionContext): void {
  const panel = vscode.window.createWebviewPanel(
    'zendoc.welcome',
    'Zendoc',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );
  welcomePanelToCloseOnCreate = panel;
  panel.onDidDispose(() => {
    welcomePanelToCloseOnCreate = undefined;
  });

  panel.webview.html = getWelcomePanelHtml();

  panel.webview.onDidReceiveMessage((message: { type: string }) => {
    if (message.type === 'createWorkspace') {
      vscode.commands.executeCommand('zendoc.createWorkspace');
    }
  });
}

function getGitHubSetupHtml(version: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: 14px;
      padding: 20px;
      color: var(--vscode-foreground);
      line-height: 1.5;
    }
    h2 { margin-top: 0; }
    ol { padding-left: 20px; }
    a { color: var(--vscode-textLink-foreground); }
    input {
      width: 100%;
      padding: 8px 12px;
      margin: 12px 0;
      font-size: 14px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      box-sizing: border-box;
    }
    button {
      padding: 10px 20px;
      font-size: 14px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      cursor: pointer;
    }
    button:hover { opacity: 0.9; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .error { color: var(--vscode-errorForeground); margin-top: 8px; }
    .success { color: var(--vscode-testing-iconPassed); margin-top: 8px; }
  </style>
</head>
<body>
  <p style="font-size:11px;color:var(--vscode-descriptionForeground);margin-bottom:16px">Zendoc v${version}</p>
  <div id="install-step">
    <h2>Set up GitHub backup</h2>
    <p style="font-weight:600;margin-bottom:8px">One more thing</p>
    <p style="color:var(--vscode-descriptionForeground)">
      Before connecting to GitHub, we need to install a small tool on your computer. (On Mac, this is called "Command Line Tools.")
    </p>
    <p id="install-wait-msg" style="display:none;margin-top:12px;font-size:13px;color:var(--vscode-descriptionForeground)">
      A window should have opened. Click Install in that window, wait for it to finish, then click Continue below.
    </p>
    <p id="install-error-msg" style="display:none;margin-top:8px;font-size:13px;color:var(--vscode-errorForeground)"></p>
    <button id="install-btn" style="margin-top:12px">Install</button>
    <button id="continue-btn" style="margin-top:12px;margin-left:8px">Continue</button>
    <button id="skip-btn" style="margin-top:12px;margin-left:8px;background:transparent;border:1px solid var(--vscode-button-border)">Skip for now</button>
  </div>
  <div id="connect-step" style="display:none">
    <h2>Set up GitHub backup</h2>
    <p style="font-size:13px;color:var(--vscode-descriptionForeground);margin-bottom:12px">First time? You'll be asked to sign in to GitHub when you click Connect.</p>
    <ol>
      <li>Create an empty repo at <a href="#" id="open-github">github.com/new</a> (no README, .gitignore, or license)</li>
      <li>Copy the repo URL from the page</li>
      <li>Paste it below and click Connect</li>
    </ol>
    <input type="text" id="repo-url" placeholder="https://github.com/username/repo-name.git" />
    <div id="message"></div>
    <button id="connect">Connect</button>
    <button id="skip-btn-connect" style="margin-top:12px;margin-left:8px;background:transparent;border:1px solid var(--vscode-button-border)">Skip for now</button>
  </div>
  <div id="success-step" style="display:none">
    <h2>Connected to GitHub</h2>
    <p id="success-msg" class="success"></p>
    <p style="margin-top:16px;font-size:13px;color:var(--vscode-descriptionForeground)">
      One more step: enable automatic backup so your changes are committed as you write.
    </p>
    <button id="enable-backup" style="margin-top:12px">Enable Automatic Backup</button>
    <div id="sharing-section" style="margin-top:24px;padding-top:16px;border-top:1px solid var(--vscode-widget-border)">
      <p style="font-size:13px;color:var(--vscode-descriptionForeground)">
        Optional: share files via links. Grant Zendoc read-only access for private file sharing.
      </p>
      <p id="sharing-status" style="font-size:12px;margin-top:8px;min-height:20px"></p>
      <button id="grant-sharing" style="margin-top:8px">Grant Zendoc sharing access</button>
    </div>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    window.addEventListener('message', (event) => {
      const { type, message } = event.data;
      const msgEl = document.getElementById('message');
      const btn = document.getElementById('connect');
      const sharingStatus = document.getElementById('sharing-status');
      const grantBtn = document.getElementById('grant-sharing');
      const installStep = document.getElementById('install-step');
      const connectStep = document.getElementById('connect-step');
      if (type === 'showInstallStep') {
        installStep.style.display = 'block';
        connectStep.style.display = 'none';
        const errEl = document.getElementById('install-error-msg');
        errEl.style.display = message ? 'block' : 'none';
        errEl.textContent = message || '';
      } else if (type === 'showConnectStep') {
        installStep.style.display = 'none';
        connectStep.style.display = 'block';
        document.getElementById('install-error-msg').style.display = 'none';
      } else if (type === 'installTriggered') {
        document.getElementById('install-wait-msg').style.display = 'block';
        document.getElementById('install-btn').style.display = 'none';
      } else if (type === 'success') {
        installStep.style.display = 'none';
        connectStep.style.display = 'none';
        document.getElementById('success-step').style.display = 'block';
        document.getElementById('success-msg').textContent = message;
      } else if (type === 'error') {
        msgEl.textContent = message;
        msgEl.className = 'error';
        btn.disabled = false;
      } else if (type === 'sharingGranted') {
        sharingStatus.textContent = 'Sharing is enabled.';
        sharingStatus.className = 'success';
        grantBtn.textContent = 'Check again';
      } else if (type === 'sharingInstructions') {
        sharingStatus.textContent = message || 'Add ZendocBot as a collaborator with Read access, then click Check again.';
        sharingStatus.className = '';
      }
    });
    document.getElementById('open-github').onclick = (e) => {
      e.preventDefault();
      vscode.postMessage({ type: 'openGitHub' });
    };
    document.getElementById('connect').onclick = () => {
      const url = document.getElementById('repo-url').value.trim();
      const msgEl = document.getElementById('message');
      const btn = document.getElementById('connect');
      if (!url) {
        msgEl.textContent = 'Enter the repo URL';
        msgEl.className = 'error';
        return;
      }
      if (!/^https:\\/\\/github\\.com\\/[\\w.-]+\\/[\\w.-]+(\\.git)?$/.test(url)) {
        msgEl.textContent = 'Use a URL like https://github.com/username/repo-name';
        msgEl.className = 'error';
        return;
      }
      msgEl.textContent = 'Connecting...';
      msgEl.className = '';
      btn.disabled = true;
      vscode.postMessage({ type: 'connect', url });
    };
    document.getElementById('enable-backup').onclick = () => {
      vscode.postMessage({ type: 'enableBackup' });
    };
    document.getElementById('grant-sharing').onclick = () => {
      vscode.postMessage({ type: 'grantSharing' });
    };
    document.getElementById('install-btn').onclick = () => {
      vscode.postMessage({ type: 'installTools' });
    };
    document.getElementById('continue-btn').onclick = () => {
      vscode.postMessage({ type: 'checkGitAgain' });
    };
    document.getElementById('skip-btn').onclick = () => {
      vscode.postMessage({ type: 'maybeLater' });
    };
    document.getElementById('skip-btn-connect').onclick = () => {
      vscode.postMessage({ type: 'maybeLater' });
    };
  </script>
</body>
</html>`;
}

async function hasRemoteOrigin(workspacePath: string): Promise<boolean> {
  try {
    await execAsync('git remote get-url origin', { cwd: workspacePath });
    return true;
  } catch {
    return false;
  }
}

function parseRepoFromRemote(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  return match ? { owner: match[1], repo: match[2] } : null;
}

async function getGitHubToken(): Promise<string | null> {
  return new Promise((resolve) => {
    const proc = spawn('git', ['credential', 'fill'], {
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    proc.stdin.write('protocol=https\nhost=github.com\n');
    proc.stdin.end();
    let data = '';
    proc.stdout.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    proc.stdout.on('end', () => {
      const m = data.match(/password=(.+)/m);
      resolve(m ? m[1].trim() : null);
    });
    proc.on('error', () => resolve(null));
  });
}

async function isZendocBotCollaborator(owner: string, repo: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/collaborators/${ZENDOC_BOT_USERNAME}`, {
      headers: { Authorization: `token ${token}` },
    });
    return res.status === 204;
  } catch {
    return false;
  }
}

/** Get GitHub token via Cursor's built-in auth (opens browser if needed). No extra tools required. */
async function getGitHubTokenFromAuth(): Promise<string> {
  const session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
  if (!session?.accessToken) {
    throw new Error('Could not get GitHub authentication. Please try again.');
  }
  return session.accessToken;
}

/** Build auth URL for git push: https://TOKEN@github.com/owner/repo.git */
function buildAuthUrl(repoUrl: string, token: string): string {
  const clean = repoUrl.trim().replace(/\.git$/, '');
  const match = clean.match(/github\.com[/:]([\w.-]+)\/([\w.-]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  const [, owner, repo] = match;
  return `https://${token}@github.com/${owner}/${repo}.git`;
}

async function runGitHubConnect(targetPath: string, repoUrl: string): Promise<void> {
  const token = await getGitHubTokenFromAuth();
  const authUrl = buildAuthUrl(repoUrl, token);

  const gitDir = path.join(targetPath, '.git');
  if (!fs.existsSync(gitDir)) {
    await runCommand('git init', targetPath);
  }
  const cleanUrl = repoUrl.trim().replace(/\.git$/, '') + '.git';
  await runCommand(`git remote add origin ${cleanUrl}`, targetPath);
  try {
    await runCommand('git rev-parse HEAD', targetPath);
  } catch {
    await runCommand('git add .', targetPath);
    await runCommand('git commit -m "Initial commit"', targetPath);
  }
  await runCommand('git branch -M main', targetPath);

  try {
    await runCommand(`git remote set-url origin '${authUrl.replace(/'/g, "'\\''")}'`, targetPath);
    await runCommand('git push -u origin main', targetPath);
  } finally {
    await runCommand(`git remote set-url origin '${cleanUrl}'`, targetPath);
  }
}

async function openWelcomeMd(workspacePath: string): Promise<void> {
  const welcomePath = vscode.Uri.joinPath(vscode.Uri.file(workspacePath), 'Welcome.md');
  try {
    await vscode.commands.executeCommand('markdownForHumans.openFile', welcomePath);
  } catch (_) {
    const doc = await vscode.workspace.openTextDocument(welcomePath);
    await vscode.window.showTextDocument(doc, { preview: false });
  }
}

function showGitHubSetupPanel(context: vscode.ExtensionContext, targetPath: string): void {
  const version = context.extension.packageJSON?.version || '0.1.8';
  const panel = vscode.window.createWebviewPanel(
    'zendoc.githubSetup',
    'Set up GitHub backup',
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  panel.webview.html = getGitHubSetupHtml(version);

  // When panel closes (skip, success, or user closes), open Welcome.md
  panel.onDidDispose(() => {
    openWelcomeMd(targetPath);
  });

  // Check git on load and show install or connect step
  checkGitAvailable().then((ok) => {
    panel.webview.postMessage({
      type: ok ? 'showConnectStep' : 'showInstallStep',
      message: ok ? undefined : undefined,
    });
  });

  panel.webview.onDidReceiveMessage(async (message: { type: string; url?: string }) => {
    if (message.type === 'enableBackup') {
      try {
        await vscode.commands.executeCommand('gitdoc.enable');
        vscode.window.showInformationMessage('Automatic backup enabled.');
        setTimeout(() => panel.dispose(), 1500);
      } catch (e) {
        log(`GitDoc enable failed: ${e}`);
        vscode.window.showErrorMessage('Could not enable GitDoc. Run "GitDoc: Enable" from the Command Palette.');
      }
    } else if (message.type === 'installTools') {
      runXcodeSelectInstall();
      panel.webview.postMessage({ type: 'installTriggered' });
      vscode.window.showInformationMessage('A window should open. Click Install, wait for it to finish, then click Continue in the panel.');
    } else if (message.type === 'checkGitAgain') {
      const ok = await checkGitAvailable();
      panel.webview.postMessage({
        type: ok ? 'showConnectStep' : 'showInstallStep',
        message: ok ? undefined : 'Install the tool first, then click Continue.',
      });
    } else if (message.type === 'maybeLater') {
      panel.dispose();
    } else if (message.type === 'openGitHub') {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/new'));
    } else if (message.type === 'connect' && message.url) {
      outputChannel?.show();
      log('Starting GitHub setup...');
      try {
        await runGitHubConnect(targetPath, message.url);
        log('Pushed to GitHub');
        outputChannel?.hide();
        panel.webview.postMessage({ type: 'success', message: 'Your work backs up to GitHub automatically.' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        log(`GitHub setup failed: ${msg}`);
        if (isXcodeSelectError(error)) {
          panel.webview.postMessage({ type: 'showInstallStep' });
          vscode.window.showErrorMessage('A tool needs to be installed first. Follow the instructions in the panel.');
        } else {
          const userMsg = msg.includes('already exists')
            ? 'A remote named "origin" already exists. Remove it first.'
            : `Failed: ${msg}. When you push, use a Personal Access Token (github.com/settings/tokens).`;
          panel.webview.postMessage({ type: 'error', message: userMsg });
        }
      }
    } else if (message.type === 'grantSharing') {
      try {
        const urlOut = await execAsync('git remote get-url origin', { cwd: targetPath });
        const repo = parseRepoFromRemote((urlOut.stdout || '').trim());
        if (!repo) {
          panel.webview.postMessage({ type: 'sharingInstructions', message: 'Could not detect repo. Add ZendocBot as a collaborator with Read access.' });
          return;
        }
        const token = await getGitHubToken();
        if (!token) {
          panel.webview.postMessage({ type: 'sharingInstructions', message: 'Could not get GitHub token. Add ZendocBot as a collaborator with Read access.' });
          vscode.env.openExternal(vscode.Uri.parse(`https://github.com/${repo.owner}/${repo.repo}/settings/access`));
          return;
        }
        const isCollaborator = await isZendocBotCollaborator(repo.owner, repo.repo, token);
        if (isCollaborator) {
          panel.webview.postMessage({ type: 'sharingGranted' });
        } else {
          panel.webview.postMessage({ type: 'sharingInstructions', message: 'Add ZendocBot as a collaborator with Read access, then click Check again.' });
          vscode.env.openExternal(vscode.Uri.parse(`https://github.com/${repo.owner}/${repo.repo}/settings/access`));
        }
      } catch (e) {
        log(`grantSharing failed: ${e}`);
        panel.webview.postMessage({ type: 'sharingInstructions', message: 'Could not check. Add ZendocBot as a collaborator with Read access.' });
      }
    }
  });
}

function applyZendocLayout(context: vscode.ExtensionContext): void {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) return;

  const welcomePath = vscode.Uri.joinPath(folder.uri, 'Welcome.md');
  fs.access(welcomePath.fsPath, fs.constants.F_OK, (err) => {
    if (err) return; // Not a Zendoc workspace
    setTimeout(async () => {
      try {
        await vscode.commands.executeCommand('workbench.view.explorer');
        if (!(await hasRemoteOrigin(folder.uri.fsPath))) {
          showGitHubSetupPanel(context, folder.uri.fsPath);
        } else {
          await openWelcomeMd(folder.uri.fsPath);
        }
      } catch (e) {
        log(`Layout apply failed: ${e}`);
      }
    }, 500);
  });
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

        const documentsPath = path.join(os.homedir(), 'Documents');
        const workspacePath = path.join(documentsPath, 'zendoc');

        if (fs.existsSync(workspacePath)) {
          log(`Using existing workspace at ${workspacePath}`);
        }

        log('Copying template...');

        const templatePath = path.join(context.extensionPath, 'resources', 'template');
        await copyDir(templatePath, workspacePath);

        // GitHub setup skipped for now (use zendoc.setupBackup command later if needed)
        log('GitHub setup skipped');

        // 1. Open workspace FIRST—creates Zendoc profile so install-extension can target it
        openWorkspaceInZendocProfile(workspacePath);

        // 2. Brief delay so profile is created when the new window starts, then install extensions
        const cliPath = getCliPath();
        const zendocExtId = 'YMSDynamics.yms-zendoc';
        const version = context.extension.packageJSON?.version || '0.1.11';
        const installZendocFromVsix = async (): Promise<boolean> => {
          const candidates = [
            path.join(context.extensionPath, `yms-zendoc-${version}.vsix`),
            path.join(context.extensionPath, '..', `yms-zendoc-${version}.vsix`),
            path.join(os.homedir(), 'Downloads', `yms-zendoc-${version}.vsix`),
          ];
          const downloadsDir = path.join(os.homedir(), 'Downloads');
          if (fs.existsSync(downloadsDir)) {
            const entries = fs.readdirSync(downloadsDir);
            const zendocVsix = entries.find((e) => e.toLowerCase().includes('zendoc') && e.endsWith('.vsix'));
            if (zendocVsix) candidates.push(path.join(downloadsDir, zendocVsix));
          }
          const cachedDir = path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'CachedExtensionVSIXs');
          if (fs.existsSync(cachedDir)) {
            const entries = fs.readdirSync(cachedDir);
            const zendocVsix = entries.find((e) => e.toLowerCase().includes('zendoc') && e.endsWith('.vsix'));
            if (zendocVsix) candidates.push(path.join(cachedDir, zendocVsix));
          }
          for (const vsix of candidates) {
            if (fs.existsSync(vsix)) {
              try {
                await runCommand(`"${cliPath}" --install-extension "${vsix}" --profile "${ZENDOC_PROFILE}"`);
                log(`Installed for ${ZENDOC_PROFILE}: Zendoc (from .vsix)`);
                return true;
              } catch (_) {}
            }
          }
          return false;
        };
        const installExts = async () => {
          // Install Zendoc: try .vsix in extension parent (from dev), else marketplace
          const fromVsix = await installZendocFromVsix();
          if (!fromVsix) {
            try {
              await runCommand(`"${cliPath}" --install-extension ${zendocExtId} --profile "${ZENDOC_PROFILE}"`);
              log(`Installed for ${ZENDOC_PROFILE}: ${zendocExtId} (marketplace)`);
            } catch (err) {
              const msg = String(err);
              if (/profile.*not found/i.test(msg)) throw err;
              log(`Failed to install Zendoc: ${err}`);
              vscode.window.showWarningMessage('Could not install Zendoc in Zendoc profile. Install from .vsix manually.', 'OK');
            }
          }
          for (const extId of REQUIRED_EXTENSIONS) {
            if (extId === zendocExtId) continue;
            try {
              await runCommand(`"${cliPath}" --install-extension ${extId} --profile "${ZENDOC_PROFILE}"`);
              log(`Installed for ${ZENDOC_PROFILE}: ${extId}`);
            } catch (err) {
              const msg = String(err);
              if (/profile.*not found/i.test(msg)) throw err;
              log(`Failed to install ${extId}: ${err}`);
              vscode.window.showWarningMessage(
                `Could not install ${extId}. Install recommended extensions in the Zendoc window when prompted.`,
                'OK'
              );
            }
          }
        };
        try {
          await new Promise((r) => setTimeout(r, 1500));
          await installExts();
        } catch (e) {
          if (/profile.*not found/i.test(String(e))) {
            log('Profile not ready, retrying after 2s...');
            await new Promise((r) => setTimeout(r, 2000));
            await installExts();
          } else throw e;
        }

        if (welcomePanelToCloseOnCreate) {
          welcomePanelToCloseOnCreate.dispose();
          welcomePanelToCloseOnCreate = undefined;
        }

        // Show workspace-ready webview
        await new Promise((r) => setTimeout(r, 500));
        showWorkspaceReadyPanel(workspacePath);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        log(`Fatal error: ${msg}`);
        vscode.window.showErrorMessage(`Zendoc setup failed: ${msg}`);
      }
    }
  );

  const showWelcome = vscode.commands.registerCommand('zendoc.showWelcome', () => {
    showWelcomePanel(context);
  });

  const setupBackup = vscode.commands.registerCommand(
    'zendoc.setupBackup',
    async (workspacePath?: string) => {
      const targetPath = workspacePath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!targetPath) {
        vscode.window.showErrorMessage('Open a Zendoc workspace first, or run Create workspace.');
        return;
      }

      if (!fs.existsSync(path.join(targetPath, '.git'))) {
        vscode.window.showErrorMessage('This folder is not a git repo. Create a workspace first.');
        return;
      }

      showGitHubSetupPanel(context, targetPath);
    }
  );

  context.subscriptions.push(createWorkspace, showWelcome, setupBackup);

  // When in a Zendoc workspace, run commands to show Explorer and open Welcome.md
  applyZendocLayout(context);

  // File watcher: auto-add .md to extensionless files (Zendoc workspaces only, skip dotfiles)
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (folder && fs.existsSync(vscode.Uri.joinPath(folder.uri, 'Welcome.md').fsPath)) {
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(folder, '**/*')
    );
    watcher.onDidCreate(async (uri) => {
      try {
        const stat = await vscode.workspace.fs.stat(uri);
        if (stat.type !== vscode.FileType.File) return;

        const basename = path.basename(uri.fsPath);
        if (basename.startsWith('.')) return;

        const ext = path.extname(uri.fsPath);
        if (ext !== '') return;

        const excluded = ['.git', '.vscode', 'node_modules', '.md4h', '.cursor'];
        if (excluded.some((d) => uri.fsPath.includes(`/${d}/`) || uri.fsPath.endsWith(`/${d}`))) return;

        const newUri = uri.with({ path: uri.path + '.md' });
        const edit = new vscode.WorkspaceEdit();
        edit.renameFile(uri, newUri);
        await vscode.workspace.applyEdit(edit);

        // Close old tab (if open) and open the renamed file
        const oldTab = vscode.window.tabGroups.all
          .flatMap((g) => g.tabs)
          .find((t) => t.input instanceof vscode.TabInputText && t.input.uri.fsPath === uri.fsPath);
        if (oldTab) {
          await vscode.window.tabGroups.close(oldTab);
        }
        const doc = await vscode.workspace.openTextDocument(newUri);
        await vscode.window.showTextDocument(doc, { preview: false });

        log(`Renamed to .md: ${basename}`);
      } catch (e) {
        log(`File rename failed: ${e}`);
      }
    });
    context.subscriptions.push(watcher);
  }

  // Show welcome webview when not already in a Zendoc workspace (session-based so it shows after install/reload)
  const isZendocWorkspace = folder
    ? fs.existsSync(vscode.Uri.joinPath(folder.uri, 'Welcome.md').fsPath)
    : false;
  if (!hasShownSessionWelcome && !isZendocWorkspace) {
    hasShownSessionWelcome = true;
    showWelcomePanel(context);
  }
  } catch (err) {
    console.error('[Zendoc] Activation failed:', err);
    if (outputChannel) {
      outputChannel.appendLine(`Activation error: ${err}`);
    }
  }
}

export function deactivate() {}
