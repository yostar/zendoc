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
function applyZendocLayout(context) {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder)
        return;
    const welcomePath = vscode.Uri.joinPath(folder.uri, 'Welcome.md');
    fs.access(welcomePath.fsPath, fs.constants.F_OK, (err) => {
        if (err)
            return; // Not a Zendoc workspace
        // Delay so workspace is fully loaded
        setTimeout(async () => {
            try {
                await vscode.commands.executeCommand('workbench.view.explorer');
                const doc = await vscode.workspace.openTextDocument(welcomePath);
                await vscode.window.showTextDocument(doc, { preview: false });
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
                vscode.window.showInformationMessage('Installing extensions...');
                // 1. Install extensions WITHOUT profile (current window = Extension Development Host uses default profile)
                for (const extId of REQUIRED_EXTENSIONS) {
                    try {
                        await runCommand(`"${cliPath}" --install-extension ${extId}`);
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
                vscode.window.showInformationMessage('Opening workspace...');
                // 2. Open folder in CURRENT window so we can run layout commands
                const uri = vscode.Uri.file(workspacePath);
                await vscode.commands.executeCommand('vscode.openFolder', uri);
                // 3. Run workbench.view.explorer (show Explorer) and open Welcome.md in Markdown for Humans
                await new Promise((resolve) => setTimeout(resolve, 800));
                const welcomePath = vscode.Uri.joinPath(uri, 'Welcome.md');
                try {
                    await vscode.commands.executeCommand('workbench.view.explorer');
                    await vscode.commands.executeCommand('markdownForHumans.openFile', welcomePath);
                }
                catch (e) {
                    log(`Layout apply failed: ${e}`);
                    try {
                        const doc = await vscode.workspace.openTextDocument(welcomePath);
                        await vscode.window.showTextDocument(doc, { preview: false });
                    }
                    catch (_) { }
                }
                vscode.window.showInformationMessage('Your workspace is ready. Check Welcome.md to get started.');
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
        // When in a Zendoc workspace, run commands to show Explorer and open Welcome.md
        applyZendocLayout(context);
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