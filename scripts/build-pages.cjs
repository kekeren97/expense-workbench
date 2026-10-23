const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const docs = path.join(root, 'docs');
fs.mkdirSync(docs, { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js', 'knowledge-data.js', 'knowledge-engine.js']) {
  fs.copyFileSync(path.join(root, 'dist', name), path.join(docs, name));
}
fs.writeFileSync(path.join(docs, '.nojekyll'), '');
fs.mkdirSync(path.join(docs, 'downloads'), { recursive: true });
fs.copyFileSync(path.join(root, 'knowledge', '星澜能源_财务报销制度知识库.md'), path.join(docs, 'downloads', 'knowledge.md'));
fs.copyFileSync(path.join(root, '智能财务预审工作台.html'), path.join(docs, 'downloads', 'expense-workbench.html'));
console.log('GitHub Pages files ready in docs/.');
