"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const os = require("os");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const ZENDOC_PROFILE = 'Zendoc';
const ZENDOC_BOT_USERNAME = 'ZendocBot';
const REQUIRED_EXTENSIONS = [
    'vsls-contrib.gitdoc',
    'yzhang.markdown-all-in-one',
    'concretio.markdown-for-humans',
    'YMSDynamics.yms-zendoc', // Needed in Zendoc profile so new window runs layout + GitHub setup
];
let outputChannel;
let welcomePanelToCloseOnCreate;
let hasShownSessionWelcome = false;
function log(message) {
    outputChannel?.appendLine(`[Zendoc] ${message}`);
}
function getCliPath() {
    const execPath = process.execPath;
    const isWindows = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    if (isMac) {
        const execDir = path.dirname(execPath);
        const cursorPath = path.join(execDir, '..', '..', '..', '..', 'Resources', 'app', 'bin', 'cursor');
        const codePath = path.join(execDir, '..', '..', '..', '..', 'Resources', 'app', 'bin', 'code');
        if (fs.existsSync(cursorPath))
            return cursorPath;
        if (fs.existsSync(codePath))
            return codePath;
    }
    if (isWindows) {
        const binDir = path.join(path.dirname(execPath), 'bin');
        const cursorPath = path.join(binDir, 'cursor.cmd');
        const codePath = path.join(binDir, 'code.cmd');
        if (fs.existsSync(cursorPath))
            return cursorPath;
        if (fs.existsSync(codePath))
            return codePath;
    }
    return process.env.CURSOR ? 'cursor' : 'code';
}
async function copyDir(src, dest) {
    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        }
        else {
            await fs.promises.copyFile(srcPath, destPath);
        }
    }
}
async function runCommand(cmd, cwd) {
    log(`Running: ${cmd}`);
    try {
        const result = await execAsync(cmd, { cwd });
        if (result.stdout)
            log(`stdout: ${result.stdout.trim()}`);
        if (result.stderr)
            log(`stderr: ${result.stderr.trim()}`);
        return result;
    }
    catch (error) {
        const err = error;
        const msg = err.stderr || err.stdout || String(error);
        log(`Error: ${msg}`);
        throw new Error(msg);
    }
}
async function checkGitAvailable() {
    try {
        await execAsync('git --version', { env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
        return true;
    }
    catch {
        return false;
    }
}
function runXcodeSelectInstall() {
    (0, child_process_1.spawn)('xcode-select', ['--install'], { stdio: 'ignore', detached: true }).unref();
}
function getWelcomePanelHtml() {
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
function showWelcomePanel(context) {
    const panel = vscode.window.createWebviewPanel('zendoc.welcome', 'Zendoc', vscode.ViewColumn.One, { enableScripts: true });
    welcomePanelToCloseOnCreate = panel;
    panel.onDidDispose(() => {
        welcomePanelToCloseOnCreate = undefined;
    });
    panel.webview.html = getWelcomePanelHtml();
    panel.webview.onDidReceiveMessage((message) => {
        if (message.type === 'createWorkspace') {
            vscode.commands.executeCommand('zendoc.createWorkspace');
        }
    });
}
function getGitHubSetupHtml() {
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
  <div id="install-step" style="display:none">
    <h2>One more thing</h2>
    <p style="color:var(--vscode-descriptionForeground)">
      Before connecting to GitHub, we need to install a small tool on your computer.
    </p>
    <p id="install-wait-msg" style="display:none;margin-top:12px;font-size:13px;color:var(--vscode-descriptionForeground)">
      A window should have opened. Click Install in that window, wait for it to finish, then click Try again below.
    </p>
    <button id="install-btn" style="margin-top:12px">Install</button>
    <button id="try-again-btn" style="margin-top:12px;margin-left:8px;display:none">Try again</button>
  </div>
  <div id="connect-step">
    <h2>Connect to GitHub</h2>
    <ol>
      <li>Create an empty repo at <a href="#" id="open-github">github.com/new</a> (no README, .gitignore, or license)</li>
      <li>Copy the repo URL from the page</li>
      <li>Paste it below and click Connect</li>
    </ol>
    <input type="text" id="repo-url" placeholder="https://github.com/username/repo-name.git" />
    <div id="message"></div>
    <button id="connect">Connect</button>
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
      } else if (type === 'showConnectStep') {
        installStep.style.display = 'none';
        connectStep.style.display = 'block';
      } else if (type === 'installTriggered') {
        document.getElementById('install-wait-msg').style.display = 'block';
        document.getElementById('install-btn').style.display = 'none';
        document.getElementById('try-again-btn').style.display = 'inline-block';
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
    document.getElementById('try-again-btn').onclick = () => {
      vscode.postMessage({ type: 'checkGitAgain' });
    };
  </script>
</body>
</html>`;
}
async function hasRemoteOrigin(workspacePath) {
    try {
        await execAsync('git remote get-url origin', { cwd: workspacePath });
        return true;
    }
    catch {
        return false;
    }
}
function parseRepoFromRemote(url) {
    const match = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
    return match ? { owner: match[1], repo: match[2] } : null;
}
async function getGitHubToken() {
    return new Promise((resolve) => {
        const proc = (0, child_process_1.spawn)('git', ['credential', 'fill'], {
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        proc.stdin.write('protocol=https\nhost=github.com\n');
        proc.stdin.end();
        let data = '';
        proc.stdout.on('data', (chunk) => { data += chunk.toString(); });
        proc.stdout.on('end', () => {
            const m = data.match(/password=(.+)/m);
            resolve(m ? m[1].trim() : null);
        });
        proc.on('error', () => resolve(null));
    });
}
async function isZendocBotCollaborator(owner, repo, token) {
    try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/collaborators/${ZENDOC_BOT_USERNAME}`, {
            headers: { Authorization: `token ${token}` },
        });
        return res.status === 204;
    }
    catch {
        return false;
    }
}
async function runGitHubConnect(targetPath, repoUrl) {
    const gitDir = path.join(targetPath, '.git');
    if (!fs.existsSync(gitDir)) {
        await runCommand('git init', targetPath);
    }
    const url = repoUrl.trim().replace(/\.git$/, '') + '.git';
    await runCommand(`git remote add origin ${url}`, targetPath);
    try {
        await runCommand('git rev-parse HEAD', targetPath);
    }
    catch {
        await runCommand('git add .', targetPath);
        await runCommand('git commit -m "Initial commit"', targetPath);
    }
    await runCommand('git branch -M main', targetPath);
    await runCommand('git push -u origin main', targetPath);
}
function showGitHubSetupPanel(context, targetPath) {
    const panel = vscode.window.createWebviewPanel('zendoc.githubSetup', 'Set up GitHub backup', vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
    panel.webview.html = getGitHubSetupHtml();
    panel.webview.onDidReceiveMessage(async (message) => {
        if (message.type === 'enableBackup') {
            try {
                await vscode.commands.executeCommand('gitdoc.enable');
                vscode.window.showInformationMessage('Automatic backup enabled.');
                setTimeout(() => panel.dispose(), 1500);
            }
            catch (e) {
                log(`GitDoc enable failed: ${e}`);
                vscode.window.showErrorMessage('Could not enable GitDoc. Run "GitDoc: Enable" from the Command Palette.');
            }
        }
        else if (message.type === 'installTools') {
            runXcodeSelectInstall();
            panel.webview.postMessage({ type: 'installTriggered' });
            vscode.window.showInformationMessage('A window should open. Click Install, wait for it to finish, then click Try again in the panel.');
        }
        else if (message.type === 'checkGitAgain') {
            const ok = await checkGitAvailable();
            panel.webview.postMessage({ type: ok ? 'showConnectStep' : 'showInstallStep' });
        }
        else if (message.type === 'openGitHub') {
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/new'));
        }
        else if (message.type === 'connect' && message.url) {
            outputChannel?.show();
            log('Starting GitHub setup...');
            try {
                await runGitHubConnect(targetPath, message.url);
                log('Pushed to GitHub');
                outputChannel?.hide();
                panel.webview.postMessage({ type: 'success', message: 'Your work backs up to GitHub automatically.' });
            }
            catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                log(`GitHub setup failed: ${msg}`);
                const userMsg = msg.includes('already exists')
                    ? 'A remote named "origin" already exists. Remove it first.'
                    : `Failed: ${msg}. When you push, use a Personal Access Token (github.com/settings/tokens).`;
                panel.webview.postMessage({ type: 'error', message: userMsg });
            }
        }
        else if (message.type === 'grantSharing') {
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
                }
                else {
                    panel.webview.postMessage({ type: 'sharingInstructions', message: 'Add ZendocBot as a collaborator with Read access, then click Check again.' });
                    vscode.env.openExternal(vscode.Uri.parse(`https://github.com/${repo.owner}/${repo.repo}/settings/access`));
                }
            }
            catch (e) {
                log(`grantSharing failed: ${e}`);
                panel.webview.postMessage({ type: 'sharingInstructions', message: 'Could not check. Add ZendocBot as a collaborator with Read access.' });
            }
        }
    });
}
function applyZendocLayout(context) {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder)
        return;
    const welcomePath = vscode.Uri.joinPath(folder.uri, 'Welcome.md');
    const gitignorePath = vscode.Uri.joinPath(folder.uri, '.gitignore');
    fs.access(welcomePath.fsPath, fs.constants.F_OK, (err) => {
        if (err)
            return; // Not a Zendoc workspace
        // Delay so workspace is fully loaded
        setTimeout(async () => {
            try {
                await vscode.commands.executeCommand('workbench.view.explorer');
                try {
                    await vscode.commands.executeCommand('markdownForHumans.openFile', welcomePath);
                }
                catch (_) {
                    const doc = await vscode.workspace.openTextDocument(welcomePath);
                    await vscode.window.showTextDocument(doc, { preview: false });
                }
                // Workaround: initial open shows plain markdown; switching away and back fixes it
                await new Promise((resolve) => setTimeout(resolve, 300));
                try {
                    const otherDoc = await vscode.workspace.openTextDocument(gitignorePath);
                    await vscode.window.showTextDocument(otherDoc, { preview: false });
                    await new Promise((resolve) => setTimeout(resolve, 150));
                    await vscode.commands.executeCommand('markdownForHumans.openFile', welcomePath);
                    const gitignoreTab = vscode.window.tabGroups.all
                        .flatMap((g) => g.tabs)
                        .find((t) => t.input instanceof vscode.TabInputText && t.input.uri.fsPath === gitignorePath.fsPath);
                    if (gitignoreTab) {
                        await vscode.window.tabGroups.close(gitignoreTab);
                    }
                }
                catch (_) {
                    try {
                        await vscode.commands.executeCommand('markdownForHumans.openFile', welcomePath);
                    }
                    catch (_) { }
                }
                if (!(await hasRemoteOrigin(folder.uri.fsPath))) {
                    showGitHubSetupPanel(context, folder.uri.fsPath);
                }
            }
            catch (e) {
                log(`Layout apply failed: ${e}`);
            }
        }, 500);
    });
}
function activate(context) {
    console.log('[Zendoc] activate() called');
    try {
        outputChannel = vscode.window.createOutputChannel('Zendoc');
        context.subscriptions.push(outputChannel);
        log('Zendoc extension activated');
        const createWorkspace = vscode.commands.registerCommand('zendoc.createWorkspace', async () => {
            try {
                outputChannel.show();
                log('Starting Create Workspace wizard...');
                const documentsPath = path.join(os.homedir(), 'Documents');
                let workspacePath = path.join(documentsPath, 'zendoc');
                if (fs.existsSync(workspacePath)) {
                    const pickOther = await vscode.window.showErrorMessage(`${workspacePath} already exists.`, 'Choose another location');
                    if (pickOther !== 'Choose another location') {
                        log('User cancelled');
                        return;
                    }
                    const defaultUri = fs.existsSync(documentsPath) ? vscode.Uri.file(documentsPath) : undefined;
                    const folderUris = await vscode.window.showOpenDialog({
                        canSelectFolders: true,
                        canSelectMany: false,
                        title: 'Choose folder',
                        openLabel: 'Select',
                        defaultUri,
                    });
                    if (!folderUris?.length) {
                        log('User cancelled');
                        return;
                    }
                    const workspaceName = await vscode.window.showInputBox({
                        prompt: 'Workspace name',
                        value: 'zendoc',
                        validateInput: (v) => (!/^[a-zA-Z0-9_-]+$/.test(v) ? 'Letters, numbers, hyphens, underscores only' : null),
                    });
                    if (!workspaceName)
                        return;
                    workspacePath = path.join(folderUris[0].fsPath, workspaceName);
                    if (fs.existsSync(workspacePath)) {
                        vscode.window.showErrorMessage(`Folder already exists: ${workspacePath}`);
                        return;
                    }
                }
                if (fs.existsSync(workspacePath)) {
                    vscode.window.showErrorMessage(`Folder already exists: ${workspacePath}`);
                    return;
                }
                vscode.window.showInformationMessage('Creating workspace...');
                log('Copying template...');
                const templatePath = path.join(context.extensionPath, 'resources', 'template');
                await copyDir(templatePath, workspacePath);
                // GitHub setup skipped for now (use zendoc.setupBackup command later if needed)
                log('GitHub setup skipped');
                const cliPath = getCliPath();
                log(`Using CLI: ${cliPath}`);
                // 1. Open workspace FIRST—creates Zendoc profile so install-extension can target it
                vscode.window.showInformationMessage('Opening workspace in Zendoc profile...');
                await runCommand(`"${cliPath}" "${workspacePath}" --profile "${ZENDOC_PROFILE}"`);
                log(`Opened ${workspacePath} in ${ZENDOC_PROFILE} profile`);
                // 2. Brief delay so profile is fully created, then install extensions
                await new Promise((resolve) => setTimeout(resolve, 1500));
                vscode.window.showInformationMessage('Installing extensions...');
                for (const extId of REQUIRED_EXTENSIONS) {
                    try {
                        await runCommand(`"${cliPath}" --install-extension ${extId} --profile "${ZENDOC_PROFILE}"`);
                        log(`Installed for ${ZENDOC_PROFILE}: ${extId}`);
                    }
                    catch (err) {
                        log(`Failed to install ${extId}: ${err}`);
                        vscode.window.showWarningMessage(`Could not install ${extId}. Install recommended extensions in the Zendoc window when prompted.`, 'OK');
                    }
                }
                if (welcomePanelToCloseOnCreate) {
                    welcomePanelToCloseOnCreate.dispose();
                    welcomePanelToCloseOnCreate = undefined;
                }
                // Show after install messages so it's visible
                await new Promise((r) => setTimeout(r, 500));
                vscode.window.showInformationMessage('Zendoc workspace ready! A new window should have opened—check for it.', 'Open Zendoc').then((sel) => {
                    if (sel === 'Open Zendoc') {
                        runCommand(`"${getCliPath()}" "${workspacePath}" --profile "${ZENDOC_PROFILE}"`);
                    }
                });
            }
            catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                log(`Fatal error: ${msg}`);
                vscode.window.showErrorMessage(`Zendoc setup failed: ${msg}`);
            }
        });
        const showWelcome = vscode.commands.registerCommand('zendoc.showWelcome', () => {
            showWelcomePanel(context);
        });
        const setupBackup = vscode.commands.registerCommand('zendoc.setupBackup', async (workspacePath) => {
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
        });
        context.subscriptions.push(createWorkspace, showWelcome, setupBackup);
        // When in a Zendoc workspace, run commands to show Explorer and open Welcome.md
        applyZendocLayout(context);
        // File watcher: auto-add .md to extensionless files (Zendoc workspaces only, skip dotfiles)
        const folder = vscode.workspace.workspaceFolders?.[0];
        if (folder && fs.existsSync(vscode.Uri.joinPath(folder.uri, 'Welcome.md').fsPath)) {
            const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(folder, '**/*'));
            watcher.onDidCreate(async (uri) => {
                try {
                    const stat = await vscode.workspace.fs.stat(uri);
                    if (stat.type !== vscode.FileType.File)
                        return;
                    const basename = path.basename(uri.fsPath);
                    if (basename.startsWith('.'))
                        return;
                    const ext = path.extname(uri.fsPath);
                    if (ext !== '')
                        return;
                    const excluded = ['.git', '.vscode', 'node_modules', '.md4h', '.cursor'];
                    if (excluded.some((d) => uri.fsPath.includes(`/${d}/`) || uri.fsPath.endsWith(`/${d}`)))
                        return;
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
                }
                catch (e) {
                    log(`File rename failed: ${e}`);
                }
            });
            context.subscriptions.push(watcher);
        }
        // Prompt to create workspace when not already in one (session-based so it shows after install/reload)
        const isZendocWorkspace = folder
            ? fs.existsSync(vscode.Uri.joinPath(folder.uri, 'Welcome.md').fsPath)
            : false;
        if (!hasShownSessionWelcome && !isZendocWorkspace) {
            hasShownSessionWelcome = true;
            vscode.window
                .showInformationMessage('Zendoc is ready. Create your writing workspace.', 'Create workspace')
                .then((selection) => {
                if (selection === 'Create workspace') {
                    vscode.commands.executeCommand('zendoc.createWorkspace');
                }
            });
        }
    }
    catch (err) {
        console.error('[Zendoc] Activation failed:', err);
        if (outputChannel) {
            outputChannel.appendLine(`Activation error: ${err}`);
        }
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map