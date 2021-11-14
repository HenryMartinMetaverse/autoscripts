const fs = require('fs')
const i18n = require('i18n')
const path = require('path')
const prompts = require('prompts')
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { osLocale } = require('os-locale-s-fix')


async function play(account = 'gagxi.wam', pos) {
  let browser = null
  const position = pos * 100
  const DefaultTimeout = 600 * 1000
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
        `--window-position=${position},${position}`,
        '--window-size=1300,900',
      ],
      ignoreHTTPSErrors: true,
      timeout: DefaultTimeout,
      userDataDir: './tmp/' + account,
    }
    if (process.pkg) {
      if (process.platform === 'darwin') {
        // macos
        const puppeteerexec = path.resolve(
          path.dirname(process.execPath),
          'Chromium.app/Contents/MacOS/Chromium'
        )
        params.executablePath = puppeteerexec
      } else {
        // win
        const puppeteerexec = path.resolve(process.cwd(), 'chrome.exe')
        params.executablePath = puppeteerexec
      }
    }
    browser = await puppeteer.launch(params)

    const page = await browser.newPage()
    await page.setDefaultTimeout(DefaultTimeout)
    await page.setViewport({ width: 1280, height: 768 })

    const loginURL = 'https://play.farmersworld.io/'
    await page.goto(loginURL, { waitUntil: 'networkidle0' })

    await page.waitForSelector('button.login-button')
    console.log(i18n.__('Login Page Load'), new Date())
    await page.waitForTimeout(2000)
    console.log(i18n.__('Init'))
    await page.click('button.login-button')
    await page.waitForTimeout(2000)
    await page.click('img[alt="wax-cloud-wallet"]')

    await page.waitForSelector('div.container__header--tilte')
    console.log(i18n.__('Login Success'), new Date())
    await page.waitForTimeout(10000)

    console.log(i18n.__('Setup Success'), new Date())

    await page.waitForTimeout(10000)
  } catch (err) {
    console.log(`❌ Error: ${err.message}`)
  } finally {
    await browser.close()
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

    if (account) {
      console.log(i18n.__('Waiting'))
      
      await play(account, position)
    }
  } catch (error) {
    console.log(error)
  }
})()
