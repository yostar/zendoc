"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const ZENDOC_PROFILE = 'Zendoc';
const REQUIRED_EXTENSIONS = [
    'vsls-contrib.gitdoc',
    'yzhang.markdown-all-in-one',
    'concretio.markdown-for-humans',
];
let outputChannel;
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
async function isGhInstalled() {
    try {
        await execAsync('gh --version');
        return true;
    }
    catch {
        return false;
    }
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
                const ghInstalled = await isGhInstalled();
                if (!ghInstalled) {
                    const install = await vscode.window.showErrorMessage('GitHub CLI (gh) is required for cloud backup. Install it with: brew install gh', 'Open install guide', 'Skip');
                    if (install === 'Open install guide') {
                        vscode.env.openExternal(vscode.Uri.parse('https://cli.github.com/'));
                    }
                    log('GitHub skipped: gh not installed');
                }
                else {
                    const connect = await vscode.window.showInformationMessage('Connect to GitHub: Your browser will open. Sign in (or create an account), then return here. Don\'t have an account? You can create one in the same flow.', 'Connect GitHub', 'Skip');
                    if (connect === 'Connect GitHub') {
                        try {
                            log('Starting gh auth login (browser will open)...');
                            await runCommand('gh auth login --web', workspacePath);
                            log('Auth complete, creating repo...');
                            await runCommand(`gh repo create ${workspaceName} --private --source=. --push`, workspacePath);
                            vscode.window.showInformationMessage('Your work backs up to GitHub automatically.');
                            log('GitHub repo created successfully');
                        }
                        catch (ghError) {
                            log(`GitHub error: ${ghError}`);
                            const retry = await vscode.window.showWarningMessage(`GitHub setup failed: ${ghError instanceof Error ? ghError.message : String(ghError)}. Your workspace works locally. You can retry from Welcome.md.`, 'Retry now', 'Continue');
                            if (retry === 'Retry now') {
                                vscode.commands.executeCommand('zendoc.setupBackup', workspacePath);
                            }
                        }
                    }
                    else {
                        log('GitHub skipped by user');
                    }
                }
                const cliPath = getCliPath();
                const cliExists = cliPath.includes('/') ? fs.existsSync(cliPath) : true;
                log(`Using CLI: ${cliPath} (exists: ${cliExists})`);
                vscode.window.showInformationMessage('Creating Zendoc profile and installing extensions (a window may open briefly)...');
                // 1. Create profile by opening Cursor briefly (profile is created if it doesn't exist)
                (0, child_process_1.exec)(`"${cliPath}" --profile "${ZENDOC_PROFILE}"`, (err) => {
                    if (err)
                        log(`Profile creation: ${err}`);
                });
                await new Promise((resolve) => setTimeout(resolve, 5000));
                // 2. Install extensions BEFORE opening workspace (so layout/extensions apply when window loads)
                vscode.window.showInformationMessage('Installing extensions (GitDoc, Markdown All in One, Markdown for Humans)...');
                for (const extId of REQUIRED_EXTENSIONS) {
                    try {
                        await runCommand(`"${cliPath}" --install-extension ${extId} --profile "${ZENDOC_PROFILE}"`);
                        log(`Installed: ${extId}`);
                    }
                    catch (err) {
                        log(`Failed to install ${extId}: ${err}`);
                        vscode.window.showWarningMessage(`Could not install ${extId}. Install it manually from the Extensions panel.`, 'Show Extensions').then((choice) => {
                            if (choice === 'Show Extensions') {
                                vscode.commands.executeCommand('workbench.view.extensions');
                            }
                        });
                    }
                }
                // 3. Open workspace in the same window (--reuse-window) so it replaces the empty profile window
                const workspaceFile = path.join(workspacePath, 'zendoc.code-workspace');
                vscode.window.showInformationMessage('Opening workspace...');
                (0, child_process_1.exec)(`"${cliPath}" "${workspaceFile}" --profile "${ZENDOC_PROFILE}" --reuse-window`, (err) => {
                    if (err) {
                        log(`Open failed: ${err}`);
                        vscode.window.showInformationMessage(`Workspace created at ${workspacePath}. Open it manually with File > Open Folder.`);
                    }
                });
                vscode.window.showInformationMessage('Your workspace is ready. A new window will open—check Welcome.md to get started.');
            }
            catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                log(`Fatal error: ${msg}`);
                vscode.window.showErrorMessage(`Zendoc setup failed: ${msg}`);
            }
        });
        const setupBackup = vscode.commands.registerCommand('zendoc.setupBackup', async (workspacePath) => {
            const targetPath = workspacePath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!targetPath) {
                vscode.window.showErrorMessage('Open a Zendoc workspace first, or run Create workspace.');
                return;
            }
            const ghInstalled = await isGhInstalled();
            if (!ghInstalled) {
                vscode.window.showErrorMessage('GitHub CLI (gh) is required. Install it with: brew install gh');
                return;
            }
            outputChannel?.show();
            log('Starting GitHub setup...');
            try {
                const connect = await vscode.window.showInformationMessage('Your browser will open. Sign in to GitHub, then return here.', 'Connect GitHub', 'Cancel');
                if (connect !== 'Connect GitHub')
                    return;
                await runCommand('gh auth login --web', targetPath);
                const workspaceName = path.basename(targetPath);
                await runCommand(`gh repo create ${workspaceName} --private --source=. --push`, targetPath);
                vscode.window.showInformationMessage('Your work backs up to GitHub automatically.');
            }
            catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                log(`GitHub setup failed: ${msg}`);
                vscode.window.showErrorMessage(`GitHub setup failed: ${msg}`);
            }
        });
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