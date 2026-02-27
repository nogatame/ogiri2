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
                return;
            }

            if (error) {
                console.error('git commit error:', output);
                // Continue despite error
            } else {
                console.log('Committed successfully.');
            }

            // Push
            console.log('Pushing to GitHub...');
            exec('git push', { cwd: watchDir }, (error, stdout, stderr) => {
                const pushOutput = stdout + (stderr || '');
                if (error) {
                    console.error('git push error (Continuing automatically):', pushOutput);
                    // Continuing automatically as requested
                } else {
                    console.log('Pushed to GitHub successfully:', pushOutput);
                }
            });
        });
    });
}

console.log(`Watching for changes in ${watchDir}...`);
fs.watch(watchDir, { recursive: true }, (eventType, filename) => {
    // Ignore .git directory, node_modules, and the script itself
    if (!filename || filename.includes('.git') || filename.includes('node_modules') || filename === 'auto_push.js') {
        return;
    }

    // Debounce to avoid multiple rapid executions
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(runGitCommands, 2000);
});
