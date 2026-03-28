const express = require('express');
const path = require('path');

const app = express();
const distDir = path.join(__dirname, 'dist/portfolio/browser');

app.use(express.static(distDir));
app.get('/*', function(req,res) {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(process.env.PORT || 8080);
