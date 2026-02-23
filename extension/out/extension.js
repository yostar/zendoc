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
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    window.addEventListener('message', (event) => {
      const { type, message } = event.data;
      const msgEl = document.getElementById('message');
      const btn = document.getElementById('connect');
      if (type === 'success') {
        document.getElementById('connect-step').style.display = 'none';
        document.getElementById('success-step').style.display = 'block';
        document.getElementById('success-msg').textContent = message;
      } else if (type === 'error') {
        msgEl.textContent = message;
        msgEl.className = 'error';
        btn.disabled = false;
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
async function runGitHubConnect(targetPath, repoUrl) {
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
                await runCommand('git init', workspacePath);
                log('Git initialized');
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
        // Prompt to create workspace when not already in one (session-based so it shows after install/reload)
        const folder = vscode.workspace.workspaceFolders?.[0];
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