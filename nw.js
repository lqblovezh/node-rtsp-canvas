let Service = require('node-windows').Service;

let svc = new Service({
	name: 'node_rtsp',
	description: 'rtsp websocket 服务器',
	script: './app.js',
	wait: '1',
	grow: '0.25',
	maxRestarts: '40'
});

svc.on('install', () => {
	svc.start();
	console.log('install complete');
});

svc.on('uninstall', () => {
	console.log('uninstall complete');
	console.log('this.service exists', svc.exists);
});

svc.on('alreadyinstalled', () => {
	console.log('this service is already installed');
});

if (svc.exists) return svc.uninstall();

svc.install();
