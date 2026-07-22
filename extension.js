const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
    parseAddDefaultConfigFromSettings();
    let disposable = vscode.commands.registerCommand('extension.addReposFromFolder', processMenuCommand);
    context.subscriptions.push(disposable);
}

async function parseAddDefaultConfigFromSettings() {
    const config = vscode.workspace.getConfiguration('add-git-repos');
    const inDirs = config.get('directories', []);
    let outDirs = [];    
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return;
    }
    for (const dir of inDirs) {
        // Handles both relative and absolute paths
        const fullPath = path.isAbsolute(dir) ? dir : path.join(workspaceFolder.uri.fsPath, dir);
        outDirs.push(fullPath);
    }
    addReposFromDirList(outDirs);
}

async function processMenuCommand(uri, allUris) {
    // allUris contains all selected items when multi-select is used
    const folders = allUris && allUris.length > 0 ? allUris : [uri];
    let outDirs = [];
    if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage('No folders selected');
        return;
    }
    for (const folder of folders) {
        outDirs.push(folder.fsPath);
    }
    addReposFromDirList(outDirs);
}

async function addReposFromDirList(dirList) {
    let reposFound = 0;
    for (const dir of dirList) {
        await scanForRepos(dir, (repoPath) => {
            vscode.commands.executeCommand('git.openRepository', repoPath);
            reposFound++;
        });
    }
    vscode.window.showInformationMessage(`Added ${reposFound} repositories`);
}

async function scanForRepos(dir, callback) {
    try {
        const gitDir = path.join(dir, '.git');
        if (fs.existsSync(gitDir) && fs.statSync(gitDir).isDirectory()) {
            callback(dir);
            return;
        }
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                await scanForRepos(path.join(dir, entry.name), callback);
            }
        }
    } catch (err) {
        // Skip directories we can't read
    }
}

module.exports = { activate };