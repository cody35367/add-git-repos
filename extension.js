const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.addReposFromFolder', async function (uri, allUris) {
        // allUris contains all selected items when multi-select is used
        const folders = allUris && allUris.length > 0 ? allUris : [uri];
        
        if (!folders || folders.length === 0) {
            vscode.window.showErrorMessage('No folders selected');
            return;
        }

        let reposFound = 0;
        for (const folder of folders) {
            await scanForRepos(folder.fsPath, (repoPath) => {
                vscode.commands.executeCommand('git.openRepository', repoPath);
                reposFound++;
            });
        }

        vscode.window.showInformationMessage(`Added ${reposFound} repositories`);
    });

    context.subscriptions.push(disposable);
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