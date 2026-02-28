const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const watchDir = __dirname;
let timeout = null;

function runGitCommands() {
    console.log(`[${new Date().toISOString()}] Changes detected. Running git commit and push...`);

    // Add all files
    exec('git add .', { cwd: watchDir }, (error, stdout, stderr) => {
        if (error) {
            console.error('git add error:', stderr);
            return;
        }

        // Commit
        const commitMsg = `Auto update: ${new Date().toLocaleString()}`;
        exec(`git commit -m "${commitMsg}"`, { cwd: watchDir }, (error, stdout, stderr) => {
            const output = stdout + (stderr || '');

            // Check if nothing to commit
            if (output.includes('nothing to commit') || output.includes('nothing added to commit')) {
                console.log('Nothing new to commit.');
                // Try push anyway in case there are unpushed commits
                pushChanges();
                return;
            }

            if (error) {
                console.error('git commit error:', output);
            } else {
                console.log('Committed successfully.');
                pushChanges();
            }
        });
    });
}

function pushChanges() {
    console.log('Pushing only new folder to GitHub main...');
    exec('git subtree split --prefix new', { cwd: watchDir }, (error, stdout, stderr) => {
        if (error) {
            console.error('git subtree split error (Continuing automatically):', stderr);
            return;
        }

        // Extract the last line which contains the commit hash for the subtree
        const lines = stdout.trim().split('\n');
        const subtreeCommit = lines[lines.length - 1].trim();

        exec(`git push origin ${subtreeCommit}:main --force`, { cwd: watchDir }, (err2, out2, stderr2) => {
            const pushOutput = out2 + (stderr2 || '');
            if (err2) {
                console.error('git push error (Continuing automatically):', pushOutput.trim());
            } else {
                console.log('Pushed new folder to GitHub main successfully:', pushOutput.trim());
            }
        });
    });
}

console.log(`Watching for changes in ${watchDir}...`);
fs.watch(watchDir, { recursive: true }, (eventType, filename) => {
    // Ignore .git directory, node_modules, and the script itself
    if (!filename || filename.includes('.git') || filename.includes('node_modules') || filename === 'auto_push.js' || filename === 'package.json') {
        return;
    }

    // Debounce to avoid multiple rapid executions
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(runGitCommands, 2000);
});
