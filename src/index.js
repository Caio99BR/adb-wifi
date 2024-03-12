const mDnsSd = require('node-dns-sd');
const { exec } = require("child_process");
const shelljs = require('shelljs');
const readline = require('node:readline');
const { stdin: input, stdout: output } = require('node:process');

var qrcode = require('qrcode-terminal');
const { nanoid } = require('nanoid');
const name = 'ADB_WIFI_' + nanoid();

function showQR() {
    let password = nanoid();
    const text = `WIFI:T:ADB;S:${name};P:${password};;`;
    qrcode.generate(text, { small: true });
    return password;
}

function getDevice(service) {
    return {
        address: service.address,
        port: service.service.port,
    };
}

function connect({address, port}, password) {
    exec(`adb pair ${address}:${port} ${password}`, (error, stdout, stderr) => {
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
}

async function startDiscover(password) {
    const device_list = await mDnsSd.discover({
        name: '_adb-tls-pairing._tcp.local'
    });
    if (device_list.length === 0)
        return await startDiscover();
    const item = getDevice(device_list[0]);
    connect(item, password);            
}

function main() {
    const rl = readline.createInterface({ input, output });
    rl.question(`Please choose which method you want to pairing device:
        [1]. Pairing device with QR code
        [2]. Pairing device with pairing code`, (answer) => {
        switch (answer) {
            case 1:
                console.log("[Developer options]->[Wireless debugging]->[Pair device with QR code]");
                startDiscover(showQR());
                break;
            case 2:
                r1.question(`Input your Pairing code:`, code => {
                    startDiscover(code); 
                });
                break;
        }
        rl.close();
    });
}

main();
