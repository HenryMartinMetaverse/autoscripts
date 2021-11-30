# AutoScripts [![NPM Version](https://img.shields.io/npm/v/wechaty?color=brightgreen)](https://www.npmjs.com/package/wechaty) [![NPM](https://github.com/wechaty/wechaty/workflows/NPM/badge.svg)](https://github.com/wechaty/wechaty/actions?query=workflow%3ANPM) 


[![GitHub stars](https://img.shields.io/github/stars/HenryMartinMetaverse/autoscripts.svg?label=github%20stars)](https://github.com/HenryMartinMetaverse/autoscripts)
[![ES Modules](https://img.shields.io/badge/ES-Modules-orange)](https://github.com/HenryMartinMetaverse/autoscripts/issues)
[![WeChat](https://img.shields.io/badge/--07C160?logo=wechat&logoColor=white)](https://wechaty.js.org/docs/puppet-providers/wechat)
[![Telegram Wechaty Channel](https://img.shields.io/badge/chat-on%20telegram-blue)](https://t.me/wechaty)

## Introduce

Automatic play script in [farmersworld](https://play.farmersworld.io/), Automatic mining and repair, automatic energy addition. Support raising chickens, raising cattle and farming. automatic earn. 

Based on background technology development, high operation efficiency, stable and not crash, a single server can run more than 50 accounts. Automatically restarts when the line is offline. 15%-20% more revenue than front-end scripts, QuickMacro, AutoHotkey
, etc.

Cross-platform, support Windows, Linux, MacOS.

:spider_web: <https://play.farmersworld.io/>  
:octocat: <https://github.com/HenryMartinMetaverse/autoscripts>  
:beetle: <https://github.com/HenryMartinMetaverse/autoscripts/issues>  


## Getting Started


### Windows System requirements

Before running, you need to download and install the software environment, because it is source code, so you need to develop the environment.

1. Download and install Git https://git-scm.com/download/win
2. Download and install NodeJS https://nodejs.org/en/
3. Open CMD and select Run with administrator rights
4. The environment required to install windows10 ```npm install --global --production windows-build-tools --verbose```

### Run

1. Download the source code ```git clone https://gitee.com/romejiang/autoscripts.git```

2. Go to the directory and install the NPM package ``` cd autoscripts && npm i --verbose ```

3. To run the setup script, ```node setup```, enter the wallet address for the first time and manually log in to the wallet

4. ```node index```, Start automatically play and earn
5. If you need to open more accounts, repeat steps 3 to 4 above.

## FAQ

1. run ```npm i``` If an error, run ``` npm i ``` again

2. If the code is updated, execute the code
```
git fetch --all
git reset --hard origin/main
git pull

```
3. Advanced features: command line support to directly enter the wallet account, such as ```node index xxxxx.wam```

4. Advanced function: in the case of multiple open, add a number at the end of the command line, so that the window can be staggered, such as: ```node index xxxxx.wam 1```
5. Advanced features: Allows only partial modules to run. For example, just mining and cattle, enter 13
``` node index xxxxx.wam 1 13```
If you raise a chicken, enter 2
``` node index xxxxx.wam 1 2```
By default, all modules are enabled
```
1 = mined
2 = chicken
3 = farming 
4 = cow
5 = build (FARM PLOT/COOP/COWSHED)
```

## Support

![Join Telegram Group](https://user-images.githubusercontent.com/93913343/142018715-9ced3d44-bf86-42bb-918f-ae70b1279c81.jpeg)

<https://t.me/farmersworldvip>

## History

### master v0.3 (Dec 2021)

Release v0.3 Added raising chicken, raising cattle, farming module, Fixed some bugs.

### master v0.2 (Nov 2021)

Release v0.2 Automatic mining and repair, automatic replenishment of energy.


## Creators

1. [Henry Martin](https://github.com/HenryMartinMetaverse)  


## Cite Autoscripts

To cite this project in publications:

```bibtex
@misc{autoscripts,
  author = {Henry Martin},
  title = {Automatic play script in farmersworld},
  year = {2021},
  publisher = {GitHub},
  journal = {GitHub Repository},
  howpublished = {\url{https://github.com/HenryMartinMetaverse/autoscripts}},
}
```

## Copyright & License

- Code & Docs © 2021-now Henry Martin
- Code released under the Apache-2.0 License
- Docs released under Creative Commons
