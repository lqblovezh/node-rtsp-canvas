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
const wsPort = '2700';

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
let playList = null;

app.post('/port', async function(req, res) {
	let url = req.body.url;
	if (!url) {
		res.send({
			data: '缺少地址',
			code: 0
		});
		return;
	}
	// cmd.run('taskkill /F /IM ffmpeg.exe')
	// cmd.run('pkill -f ffmpeg.exe')
	await startFFmpeg(url);
	setTimeout(() => {
		res.send({
			data: '启动',
			code: 0
		});
	}, 4000);
});

app.get('/port/stop', async function(req, res) {
	cmd.run('taskkill /F /IM ffmpeg.exe');
	// cmd.run('pkill -f ffmpeg.exe');
	callfile.exec(
		'sh stop.sh',
		null,
		await function(err, stdout, stderr) {
			playList && playList.stop(); // 关闭websocker端口
			res.send({
				data: '关闭成功',
				code: 0
			});
		}
	);
});

async function startFFmpeg(url) {
	console.log('----stoping----');
	playList && playList.stop();
	callfile.exec(
		'sh stop.sh',
		null,
		await function(err, stdout, stderr) {
			console.log('----stoped----');
			const options = {
				name: 'streamName',
				url,
				wsPort
			};
			playList = new Stream(options);
			playList.start();
			playList.port = wsPort;
		}
	);
}
