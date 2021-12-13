const i18n = require('i18n')
const path = require('path')
const axios = require('axios')
const prompts = require('prompts')
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { osLocale } = require('os-locale-s-fix')

const s = (ss) =>
  new Promise((res, rej) => {
    setTimeout(res, ss * 1000)
  })
const s10 = () =>
  new Promise((res, rej) => {
    return setTimeout(res, 10 * 1000)
  })
const s30 = () =>
  new Promise((res, rej) => {
    return setTimeout(res, 30 * 1000)
  })

Date.prototype.format = function (fmt) {
  var o = {
    'M+': this.getMonth() + 1,
    'd+': this.getDate(),
    'h+': this.getHours(),
    'm+': this.getMinutes(),
    's+': this.getSeconds(),
    'q+': Math.floor((this.getMonth() + 3) / 3),
    S: this.getMilliseconds(),
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      )
    }
  }
  return fmt
}

const maxenergy = 0 // You can set the to 150

async function play(account = 'gagxi.wam', pos, module) {
  let browser = null
  const position = pos * 150
  const DefaultTimeout = 90 * 1000
  try {
    puppeteer.use(StealthPlugin())
    const params = {
      headless: false,
      args: [
        "--proxy-server='direct://'",
        '--proxy-bypass-list=*',
        '--ignore-certificate-errors',
        '--no-sandbox',
        '--disable-infobars',
        '--disable-setuid-sandbox',
        `--window-position=${position * 2},${position}`,
        '--window-size=1300,900',
      ],
      ignoreHTTPSErrors: true,
      timeout: DefaultTimeout,
      userDataDir: './tmp/' + account,
    }
    if (process.pkg) {
      if (process.platform === 'darwin') {
        // for macos
        const puppeteerexec = path.resolve(
          path.dirname(process.execPath),
          'Chromium.app/Contents/MacOS/Chromium'
        )
        params.executablePath = puppeteerexec
        params.userDataDir = path.resolve(path.dirname(process.execPath), 'tmp', account)
      } else if (
        process.platform === 'win32' ||
        process.env.OSTYPE === 'cygwin' ||
        process.env.OSTYPE === 'msys'
      ) {
        // for win
        const puppeteerexec = path.resolve(process.cwd(), 'chrome-win', 'chrome.exe')
        params.executablePath = puppeteerexec
        params.userDataDir = path.resolve(path.dirname(process.execPath), 'tmp', account)
      } else {
        // linux
        const puppeteerexec = path.resolve(path.dirname(process.execPath), 'chrome-linux/chrome')
        params.executablePath = puppeteerexec
        params.userDataDir = path.resolve(path.dirname(process.execPath), 'tmp', account)
      }
    }
    browser = await puppeteer.launch(params)

    const page = await browser.newPage()
    await page.setDefaultTimeout(DefaultTimeout)
    await page.setViewport({ width: 1280, height: 768 })
    page.on('console', (consoleObj) => {
      if (consoleObj.text().indexOf('inner-') === 0) {
        const key = consoleObj.text().replace('inner-', '')
        console.log(i18n.__(key), new Date().format(' yyyy-MM-dd hh:mm:ss'))
      }
    })

    const loginURL = 'https://play.farmersworld.io/'
    await page.goto(loginURL, { waitUntil: 'networkidle0' })

    await page.waitForSelector('button.login-button')
    console.log(i18n.__('Login Page Load'), new Date().format(' yyyy-MM-dd hh:mm:ss'))

    await page.waitForTimeout(2000)
    await page.click('button.login-button')
    await page.waitForTimeout(2000)
    await page.click('img[alt="wax-cloud-wallet"]')

    await page.waitForSelector('div.container__header--tilte')
    console.log(i18n.__('Login Success'), new Date().format(' yyyy-MM-dd hh:mm:ss'))
    await page.waitForTimeout(5000)
    await page.click('div.game-container')
    while (true) {
      if (module.includes('1')) {
        await selected(page, 'home-map')
        if (await checkMing(page)) {
          await click(page, account, 'Mine')
          await click(page, account, 'Claim')
          await click(page, account, 'Repair')

          await energy(page, account)
        } else {
          process.stdout.write(
            account + i18n.__('Not Mine') + new Date().format(' yyyy-MM-dd hh:mm:ss') + '\r'
          )
        }
      }
      if (module.includes('2')) {
        await selected(page, 'chicken-map')
        if (await checkMapTitle(page)) {
          await click(page, account, 'Feed', 3)
          await click(page, account, 'Hatch', 3)
          await energy(page, account)
        } else {
          await home(page)
          process.stdout.write(
            account + i18n.__('Not Chicken') + new Date().format(' yyyy-MM-dd hh:mm:ss') + '\r'
          )
        }
      }

      if (module.includes('3')) {
        await selected(page, 'crop-map')
        if (await checkMapTitle(page)) {
          await click(page, account, 'Water', 8)
          await energy(page, account)
        } else {
          await home(page)
          process.stdout.write(
            account + i18n.__('Not Crop') + new Date().format(' yyyy-MM-dd hh:mm:ss') + '\r'
          )
        }
      }

      if (module.includes('4')) {
        await selected(page, 'cow-map')
        if (await checkMapTitle(page)) {
          await click(page, account, 'Feed', 2)
          await energy(page, account)
        } else {
          await home(page)
          process.stdout.write(
            account + i18n.__('Not Cow') + new Date().format(' yyyy-MM-dd hh:mm:ss') + '\r'
          )
        }
      }
      if (module.includes('5')) {
        await build(page)
        await energy(page, account)
      }
      await s10()
    }
  } catch (err) {
    console.log(`❌ Error: ${err}`)
  } finally {
    await browser.close()
  }
}

async function checkMing(page) {
  let empty = await page.$('.empty-container')
  return !empty
}

async function checkMapTitle(page) {
  let title = await page.$('.modal-map-title')
  return !title
}

async function checkCPU(page, title) {
  let checklist = [
    page.waitForSelector('.modal-stake-header'),
    page.waitForSelector('.modal__button-group>.button-section'),
    // page.waitForSelector('.close-modal'),
    page.waitForFunction(() => {
      var msg = document.querySelector('div.flash-message-content')
      if (msg) {
        return msg.innerText.includes('successful')
      }
      return false
    }),
    page.waitForFunction(async () => {
      var msg = document.querySelector('div.flash-message-content')
      if (msg) {
        if (msg.innerText.includes('Repairing')) {
          await new Promise((resolve, reject) => setTimeout(resolve, 3000))
          return true
        }
      }
      return false
    }),
    page.waitForFunction(() => {
      var msg = document.querySelector('div.flash-message-content')
      if (msg) {
        return msg.innerText.includes('Eating')
      }
      return false
    }),
  ]

  let champion = await Promise.race(checklist)
  await s(2)
  if (champion) {
    if (champion.constructor.name === 'ElementHandle') {
      const stake = await champion.evaluate((node) => node.getAttribute('class'))
      if ('modal-stake-header' === stake) {
        const close_modal = await page.waitForSelector('.close-modal')
        await close_modal.click()
      } else {
        champion.click()
      }
      // }else{
      // await s(3)
    }
    console.log(i18n.__(title), new Date().format(' yyyy-MM-dd hh:mm:ss'))
    await page.click('div.game-container')
  }
}

async function selected(page, title) {
  await page.$$eval('div.navbar-group--tilte', async (element) => {
    for (const elem of element) {
      if (elem.innerText.includes('Map')) {
        await elem.click()
        return true
      }
    }
    return false
  })
  await s(1)
  await page.$$eval(
    '.map-container-bg',
    async (element, title) => {
      for (const elem of element) {
        if (elem.style['background-image'].includes(title)) {
          await elem.click()
          return true
        }
      }
      return false
    },
    title
  )
  await s(2)
}

async function home(page) {
  let isClick3 = await page.$$eval('div.navbar-group--tilte', async (element) => {
    for (const elem of element) {
      if (elem.innerText.includes('Home')) {
        await elem.click()
        return true
      }
    }
    return false
  })
  await page.waitForTimeout(1000)
}

async function build(page) {
  let isClick = await page.$$eval('div.navbar-group--tilte', async (element) => {
    for (const elem of element) {
      if (elem.innerText.includes('Map')) {
        await elem.click()
        return true
      }
    }
    return false
  })
  await s(2)
  let isClick2 = await page.$$eval('div.plain-button', async (element) => {
    for (const elem of element) {
      if (elem.innerText.includes('Build')) {
        console.log('inner-Build Plant')
        await elem.click()
        return true
      }
    }
    return false
  })
  if (isClick2) {
    isMint = true
    await s(10)
  }
  await s(2)
  let isClick3 = await page.$$eval('div.navbar-group--tilte', async (element) => {
    for (const elem of element) {
      if (elem.innerText.includes('Home')) {
        await elem.click()
        return true
      }
    }
    return false
  })
  // console.log(isClick, isClick2, isClick3)
}

//
async function energy(page, account = 'gagxi.wam') {
  // if (isMint) {
  try {
    isMint = false
    process.stdout.write(
      account + i18n.__('Energy Check') + new Date().format(' yyyy-MM-dd hh:mm:ss') + '\r'
    )

    const data = {
      json: true,
      code: 'farmersworld',
      scope: 'farmersworld',
      table: 'accounts',
      lower_bound: account,
      upper_bound: account,
      index_position: 1,
      key_type: 'i64',
      limit: '100',
    }

    const res = await axios.post('https://wax.pink.gg/v1/chain/get_table_rows', data, {
      timeout: 90 * 1000,
    })
    // const res = await axios.post('https://api.waxsweden.org/v1/chain/get_table_rows', data)
    // const res = await axios.post('https://api.wax.alohaeos.com/v1/chain/get_table_rows', data)
    if (res.status === 200) {
      const json = res.data
      let last = json['rows'][0]['max_energy'] - json['rows'][0]['energy']
      let balances = json['rows'][0].balances
      let FOOD = 0
      for (const bal of balances) {
        if (bal.includes('FOOD')) {
          const temparr = bal.split(' ')
          if (temparr && temparr.length > 0) {
            FOOD = parseInt(temparr[0])
          }
        }
      }
      if (maxenergy) {
        last = maxenergy - json['rows'][0]['energy']
      }
      if (last > parseInt(FOOD * 5)) {
        last = parseInt(FOOD * 5)
      }
      if (last > 0) {
        console.log(i18n.__('Energy', last), new Date().format(' yyyy-MM-dd hh:mm:ss'))
        await page.click('img.resource-energy--plus[alt="plus"]')
        await page.waitForTimeout(2000)
        await page.type('input.modal-input', last + '')
        await page.waitForTimeout(2000)

        let isClick = await page.$$eval('button.button-section', async (element) => {
          for (const elem of element) {
            if (elem.innerText.includes('Exchange')) {
              await elem.click()
              return true
            }
          }
          return false
        })
        if (isClick) {
          // let modal = await page.$('.modal-content')
          await checkCPU(page, 'Energy Success')
          // if (!(await checkCPU(page))) {
          //   isMint = false
          //   await page.waitForSelector('div.flash-message-content')
          //   console.log(i18n.__('Energy Success'), new Date().format(" yyyy-MM-dd hh:mm:ss"))
          // } else {
          //   await page.click('div.game-container')
          // }
          await s(2)
        }
        await page.click('div.game-container')
      }
    }
  } catch (error) {
    console.log(error.toString())
  }
  // }
}
async function click(page, account, title, count = 24) {
  process.stdout.write(
    account + i18n.__('Check') + new Date().format(' yyyy-MM-dd hh:mm:ss') + '\r'
  )
  for (let index = 0; index < count; index++) {
    const tools = await page.$('img[alt="' + index + '"]')
    if (tools) {
      await page.click('img[alt="' + index + '"]')
      await page.waitForTimeout(1500)
      var timeout = await page.$eval('div.card-container--time', (card) => card.innerText)
      if (count > 9 || timeout == '00:00:00') {
        let isClick = await page.$$eval(
          'div.plain-button',
          (elements, title) => {
            for (const ele of elements) {
              if (ele.innerText.includes(title) && !ele.className.includes('disabled')) {
                console.log('inner-' + title)
                ele.click()
                return true
              }
            }
            return false
          },
          title
        )
        if (isClick) {
          await checkCPU(page, title + ' Success')
        }
      }
    }
  }
}

;(async () => {
  try {
    i18n.configure({
      locales: ['en', 'zh'],
      directory: path.join(__dirname, 'locales'),
    })

    const language = await osLocale()
    if (language && language.length > 2) {
      i18n.setLocale(language.substring(0, 2))
    }

    const args = process.argv.splice(2)
    let account = args[0] || ''
    const position = Number(args[1] || 0)
    const module = args[2] || '12345'

    if (!account) {
      const response = await prompts({
        type: 'text',
        name: 'account',
        message: i18n.__('Enter your wallet account:'),
        validate: (value) => {
          if (value.includes('.wam')) {
            return true
          }
          if (/[a-z1-5]{12}/.test(value)) {
            return true
          }
          return i18n.__('Invalid wallet account %s', value)
        },
      })
      account = response.account
    }

    while (true) {
      try {
        if (account) {
          console.log(i18n.__('Waiting'))
          await play(account, position, module)
        }
      } catch (error) {
        console.log(i18n.__('Offline'), new Date().format(' yyyy-MM-dd hh:mm:ss'))
        await s30()
      }
    }
  } catch (error) {
    console.log(error)
  }
})()
