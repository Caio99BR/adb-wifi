const mDnsSd = require('node-dns-sd');
const { exec } = require("child_process");
const shelljs = require('shelljs');
const inquirer = require('inquirer');
const { stdin: input, stdout: output } = require('node:process');

var qrcode = require('qrcode-terminal');
const { nanoid } = require('nanoid');
const name = 'ADB_WIFI_' + nanoid();

// some ADB version disable mDNS, reopen it
async function init() {
	await exec(`ADB_MDNS_OPENSCREEN=1; adb mdns check; adb kill-server; adb start-server`);
}

init();

function showQR() {
    let password = nanoid();
    const text = `WIFI:T:ADB;S:${name};P:${password};;`;
    qrcode.generate(text, { small: true });
    return { code: password };
}

function getDevice(service) {
    return {
        address: service.address,
        port: service.service.port,
    };
}

function connect({address, port}, password) {
	console.log('connect to device...');
    exec(`adb pair ${address}:${port} ${password.code}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
	exec(`adb connect ${address}`);
}

async function startDiscover(password) {
    const device_list = await mDnsSd.discover({
        name: '_adb-tls-pairing._tcp.local'
    });
    if (device_list.length === 0)
        return await startDiscover(password);
    const item = getDevice(device_list[0]);
    connect(item, password);            
}

function main() {
	const questions = [
		{
			type: 'input',
			name: 'type',
			message: 
`Please choose which method you want to pairing device:
[1]. Pairing device with QR code
[2]. Pairing device with pairing code
`
		},
	];
	const pairingCodeQuestions = [
		{
			type: 'input',
			name: 'code',
			message: 'Input your Pairing code:',
		}
	];
	inquirer.prompt(questions).then(answers => {
		switch (answers.type) {
			case '1':
				console.log("[Developer options]->[Wireless debugging]->[Pair device with QR code]");
				startDiscover(showQR());
				break;
			case '2':
				inquirer.prompt(pairingCodeQuestions).then(code => {
					startDiscover(code); 
				});
				break;
			default:
				console.log('quit...');				
		}
	});
}

main();
