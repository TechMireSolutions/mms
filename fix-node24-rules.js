const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFile(filePath) {
    if (!filePath.endsWith('.md') && !filePath.endsWith('.mdc')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fastify + tsx -> Fastify + --experimental-strip-types
    content = content.replace(/Fastify (\d+) \+ tsx/g, 'Fastify $1 + --experimental-strip-types');
    
    // axios/node-fetch -> fetch
    content = content.replace(/axios/g, 'native fetch()');
    content = content.replace(/node-fetch/g, 'native fetch()');

    // dotenv -> --env-file
    content = content.replace(/dotenv/g, '--env-file / process.loadEnvFile()');

    // ws -> native WebSocket
    // content = content.replace(/\bws\b(?!\/)/g, 'native WebSocket'); // careful with this

    // url.parse -> new URL()
    content = content.replace(/url\.parse/g, 'new URL()');

    // fast-glob -> node:fs/promises
    content = content.replace(/fast-glob/g, "import { glob } from 'node:fs/promises'");

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    }
}

walkDir('./.agent/rules', processFile);
walkDir('./.agent/skills', processFile);
walkDir('./.cursor/rules', processFile);
walkDir('./.cursor/skills', processFile);
