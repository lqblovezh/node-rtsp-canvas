// express资源
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
// jsmpeg moment child_process脚本所需
const Stream = require("node-rtsp-stream-jsmpeg");
const moment = require("moment");
const callfile = require("child_process");
moment.locale("zh-cn");
var cmd = require("node-cmd");
let wsPort = 2700;
const maxLength = 10;
let restartTime = 10 * 1000; //防崩溃时间 10S
// let restartTime = 30 * 60 * 1000; //防崩溃时间 半个小时

// 静态服务器
// app.use(express.static(path.join(__dirname, 'resource')));
app.listen(8088, () => {
  console.log(`App listening at port 8088`);
});
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

// 设置允许跨域访问该服务.
app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");
  next();
});

// 初始化加载
let playList = [];

app.post("/port", async function (req, res) {
  let url = req.body.url;
  if (!url) {
    return res.send({
      data: "缺少地址",
      code: 0,
    });
  }
  if (playList.length >= maxLength) {
    return res.send({
      msg: `已超过${maxLength}条限制，等待他人关闭后重试！`,
      code: 1,
    });
  }
  let findUrl = playList.find((item) => item.url == url);
  let port = wsPort;
  if (findUrl) {
    findUrl.number += 1;
    return res.send({
      data: "启动",
      code: 0,
      port: findUrl.port,
    });
  } else {
    wsPort += 5;
    playList.push({
      port,
      number: 1,
      url,
    });
  }
  await startFFmpeg(url, port);
  setTimeout(() => {
    res.send({
      data: "启动",
      code: 0,
      port,
    });
  }, 0);
});

app.get("/port/stop", async function (req, res) {
  let url = req.query.url;
  if (!url) {
    return res.send({
      data: "缺少地址",
      code: 0,
    });
  }
  let findUrl = playList.find((item) => item.url == url);
  if (findUrl) {
    if (findUrl.number <= 1) {
      let port = findUrl.port;
      let url = findUrl.url;
      cmd.run(`ps -ef | grep ${url} | cut -c 9-15 | xargs kill -9`);
      callfile.exec(
        `"sh hiStop.sh" ${port} ${url}`,
        null,
        await function (err, stdout, stderr) {
          console.log("---------stop----------");
          findUrl.stream.stop();
          let index = playList.findIndex((item) => item.url == url);
          playList.splice(index, 1);
          if (!playList.length) {
            wsPort = 2700;
          }
          res.send({
            data: "关闭成功",
            code: 0,
          });
        }
      );
    } else {
      findUrl.number -= 1;
    }
  }
});

async function startFFmpeg(url, wsPort) {
  const options = {
    name: "streamName" + wsPort,
    url,
    wsPort,
  };
  console.log(options, 1111);
  let findUrl = playList.find((item) => item.url == url);
  findUrl.stream = new Stream(options);
  findUrl.stream.start();
}

setInterval(() => {
  for (var i = 0; i < playList.length; i++) {
    let currentIndex = i;
    callfile.exec(`ps -ef | grep '${playList[i].url}'`, null, function (
      err,
      stdout,
      stderr
    ) {
      if (stdout.indexOf("-rtsp_transport") == -1) {
        playList[currentIndex].stream.start();
      }
    });
  }
}, restartTime);
