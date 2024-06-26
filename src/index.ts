import { napCatCore } from '@/core';
import { program } from 'commander';
import qrcode from 'qrcode-terminal';
import fs from 'fs/promises';
import path from 'node:path';
import { postLoginStatus } from '@/common/utils/umami';
import { checkVersion } from '@/common/utils/version';
import { log, logDebug, logError, LogLevel, setLogLevel } from '@/common/utils/log';
import { NapCatOnebot11 } from '@/onebot11/main';
import { hookApi } from '@/core/external/hook';

program
  .option('-q, --qq <type>', 'QQ号')
  .parse(process.argv);

const cmdOptions = program.opts();
// console.log(process.argv);

for(let k=0; k<30; k++) {
  new Promise((r, j) => {
    hookApi.getRKey();
  }).then();
}
checkVersion().then((remoteVersion: string) => {
  const localVersion = require('./package.json').version;
  const localVersionList = localVersion.split('.');
  const remoteVersionList = remoteVersion.split('.');
  log('[NapCat]  当前版本:', localVersion);
  for (const k of [0, 1, 2]) {
    if (parseInt(remoteVersionList[k]) > parseInt(localVersionList[k])) {
      console.log('[NapCat] 检测到更新,请前往 https://github.com/NapNeko/NapCatQQ 下载 NapCatQQ V', remoteVersion);
      return;
    } else if (parseInt(remoteVersionList[k]) < parseInt(localVersionList[k])) {
      break;
    }
  }
  logDebug('[NapCat]  当前已是最新版本');
  return;
}).catch((e) => {
  logError('[NapCat] 检测更新失败');
});
new NapCatOnebot11();
napCatCore.onLoginSuccess(() => {
  console.log('登录成功!');
  postLoginStatus();
});
const showQRCode = (qrCodeData: { url: string, base64: string, buffer: Buffer }) => {
  console.log('请扫描下面的二维码，然后在手Q上授权登录：');
  const qrcodePath = path.join(__dirname, 'qrcode.png');
  qrcode.generate(qrCodeData.url, { small: true }, (res) => {
    console.log(`${res}\n二维码解码URL: ${qrCodeData.url}\n如果控制台二维码无法扫码，可以复制解码url到二维码生成网站生成二维码再扫码，也可以打开下方的二维码路径图片进行扫码`);
    fs.writeFile(qrcodePath, qrCodeData.buffer).then(() => {
      console.log('二维码已保存到', qrcodePath);
    });
  });
};
const quickLoginQQ = cmdOptions.qq;
// napCatCore.on('system.login.error', (result) => {
//   console.error('登录失败', result);
//   napCatCore.qrLogin().then().catch(console.error);
// });
if (quickLoginQQ) {
  log('正在快速登录 ', quickLoginQQ);
  napCatCore.quickLogin(quickLoginQQ).then(res=>{
    if (res.loginErrorInfo.errMsg){
      logError('快速登录错误:', res.loginErrorInfo.errMsg);
    }
  }).catch((e) => {
    console.error(e);
    napCatCore.qrLogin().then(showQRCode);
  });
} else {
  log('没有 -q 参数指定快速登录的QQ，将使用二维码登录方式');
  napCatCore.qrLogin().then(showQRCode);
}

// napCatCore.login.service.getLoginList().then((res) => {
//     const quickLoginUinList = res.LocalLoginInfoList.filter((item) => item.isQuickLogin).map((item) => item.uin);
//     if (quickLoginUinList.length !== 0) {
//       const askQuickLoginUin = readline.createInterface({
//         input: process.stdin,
//         output: process.stdout
//       });
//       const prompt = `选择快速登录的账号\n\n ${quickLoginUinList.map((u, index) => `${index}: ${u}\n`)}\n输入对应序号按回车确定: `;
//       askQuickLoginUin.question(prompt, (uinIndex) => {
//         console.log('你选择的是:', uinIndex);
//         const uin = quickLoginUinList[parseInt(uinIndex)];
//         if (!uin) {
//           console.error('请输入正确的序号');
//           return;
//         }
//         console.log('开始登录', uin);
//         napCatCore.login.quick(uin).then().catch((e) => {
//           console.error(e);
//         });
//       });
//     }
//   }
// );
//napCatCore.passwordLogin("", "").then(console.log).catch((e) => {
//   console.log(e)
//})
