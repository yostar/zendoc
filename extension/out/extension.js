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
function getCliCommand() {
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
    try {
        return await execAsync(cmd, { cwd });
    }
    catch (error) {
        const err = error;
        throw new Error(err.stderr || err.stdout || String(error));
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
    const createWorkspace = vscode.commands.registerCommand('zendoc.createWorkspace', async () => {
        try {
            const folderUris = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectMany: false,
                title: 'Choose where to create your Zendoc workspace',
                openLabel: 'Select Folder',
            });
            if (!folderUris || folderUris.length === 0) {
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
                return;
            }
            const workspacePath = path.join(parentPath, workspaceName);
            if (fs.existsSync(workspacePath)) {
                vscode.window.showErrorMessage(`Folder already exists: ${workspacePath}`);
                return;
            }
            vscode.window.showInformationMessage('Creating workspace...');
            const templatePath = path.join(context.extensionPath, 'resources', 'template');
            await copyDir(templatePath, workspacePath);
            await runCommand('git init', workspacePath);
            vscode.window.showInformationMessage("Don't have a GitHub account? You can create one when the browser opens—it's all in one flow.");
            const ghInstalled = await isGhInstalled();
            if (!ghInstalled) {
                const install = await vscode.window.showErrorMessage('GitHub CLI (gh) is required. Install it with: brew install gh', 'Open install guide', 'Skip');
                if (install === 'Open install guide') {
                    vscode.env.openExternal(vscode.Uri.parse('https://cli.github.com/'));
                }
            }
            else {
                try {
                    await runCommand('gh auth login', workspacePath);
                    await runCommand(`gh repo create ${workspaceName} --private --source=. --push`, workspacePath);
                    vscode.window.showInformationMessage('Your work backs up to GitHub automatically.');
                }
                catch (ghError) {
                    const retry = await vscode.window.showWarningMessage('GitHub setup was skipped or failed. Your workspace works locally. You can retry later.', 'Retry now', 'Continue');
                    if (retry === 'Retry now') {
                        vscode.commands.executeCommand('zendoc.setupBackup', workspacePath);
                    }
                }
            }
            const cli = getCliCommand();
            for (const extId of REQUIRED_EXTENSIONS) {
                try {
                    await runCommand(`${cli} --install-extension ${extId} --profile "${ZENDOC_PROFILE}"`);
                }
                catch {
                    vscode.window.showWarningMessage(`Could not install ${extId}. You can install it manually.`);
                }
            }
            vscode.window.showInformationMessage('Opening workspace in Zendoc profile...');
            (0, child_process_1.exec)(`${cli} "${workspacePath}" --profile "${ZENDOC_PROFILE}"`, (err) => {
                if (err) {
                    vscode.window.showInformationMessage(`Workspace created at ${workspacePath}. Open it manually.`);
                }
            });
            vscode.window.showInformationMessage('Your workspace is ready. A new window will open—check Welcome.md to get started.');
        }
        catch (error) {
            vscode.window.showErrorMessage(`Zendoc setup failed: ${error instanceof Error ? error.message : String(error)}`);
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
        try {
            await runCommand('gh auth login', targetPath);
            const workspaceName = path.basename(targetPath);
            await runCommand(`gh repo create ${workspaceName} --private --source=. --push`, targetPath);
            vscode.window.showInformationMessage('Your work backs up to GitHub automatically.');
        }
        catch (error) {
            vscode.window.showErrorMessage(`GitHub setup failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    context.subscriptions.push(createWorkspace, setupBackup);
    const hasShownWelcome = context.globalState.get('zendoc.welcomeShown');
    if (!hasShownWelcome) {
        context.globalState.update('zendoc.welcomeShown', true);
        vscode.window
            .showInformationMessage('Create your Zendoc workspace', 'Create workspace')
            .then((choice) => {
            if (choice === 'Create workspace') {
                vscode.commands.executeCommand('zendoc.createWorkspace');
            }
        });
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map