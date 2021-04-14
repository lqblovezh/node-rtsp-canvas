// express资源
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
// jsmpeg moment child_process脚本所需
const Stream = require('node-rtsp-stream-jsmpeg');
const moment = require('moment');
const callfile = require('child_process');
moment.locale('zh-cn');
var cmd = require('node-cmd');
let wsPort = 2700;
const maxLength = 10;

// 静态服务器
// app.use(express.static(path.join(__dirname, 'resource')));
app.listen(8088, () => {
	console.log(`App listening at port 8088`);
});
app.use(bodyParser.json());
app.use(
	bodyParser.urlencoded({
		extended: false
	})
);

// 设置允许跨域访问该服务.
app.all('*', function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', '*');
	res.header('Access-Control-Allow-Methods', '*');
	next();
});

// 初始化加载
let playList = [];
let LockUp = false;

app.post('/port', async function(req, res) {
	if (LockUp) {
		return res.send({
			msg: '同时启动请稍后',
			code: 1
		});
	}
	let url = req.body.url;
	if (!url) {
		return res.send({
			data: '缺少地址',
			code: 0
		});
	}
	let findUrl = playList.find((item) => item.url == url);
	if (findUrl) {
		findUrl.number += 1;
		return res.send({
			data: '启动',
			code: 0,
			port: findUrl.port
		});
	}
	if (playList.length >= maxLength) {
		return res.send({
			msg: `已超过${maxLength}条限制，等待他人关闭后重试！`,
			code: 1
		});
	}
	let port = wsPort;
	await startFFmpeg(url, port);
	setTimeout(() => {
		console.log(playList);
		LockUp = false;
		wsPort += 5;
		res.send({
			data: '启动',
			code: 0,
			port
		});
	}, 4000);
});

app.get('/port/stop', async function(req, res) {
	let url = req.query.url;
	if (!url) {
		return res.send({
			data: '缺少地址',
			code: 0
		});
	}
	let findUrl = playList.find((item) => item.url == url);
	if (findUrl) {
		if (findUrl.number <= 1) {
			let port = findUrl.port;
			let url = findUrl.url;
			cmd.run(`ps -ef | grep ${url} | cut -c 9-15 | xargs kill -9`);
			console.log(url, 1);
			callfile.exec(
				`"sh hiStop.sh" ${port} ${url}`,
				null,
				await function(err, stdout, stderr) {
					console.log('---------stop----------');
					findUrl.stream.stop();
					let index = playList.findIndex((item) => item.url == url);
					playList.splice(index, 1);
					if (!playList.length) {
						wsPort = 2700;
					}
					res.send({
						data: '关闭成功',
						code: 0
					});
				}
			);
		} else {
			findUrl.number -= 1;
		}
	}
});

async function startFFmpeg(url, wsPort) {
	LockUp = true;
	const options = {
		name: 'streamName' + wsPort,
		url,
		wsPort
	};
	let obj = {};
	obj.stream = new Stream(options);
	obj.stream.start();
	obj.port = wsPort;
	obj.number = 1;
	obj.url = url;
	playList.push(obj);
}
