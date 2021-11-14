const i18n = require('i18n')
const path = require('path')
const axios = require('axios')
const crypto = require('crypto')
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

const maxenergy = 0 // You can set the to 150
let isMint = false
let encrypted =
  'ulQCaH6RYxXsoTe2SsVOkrkMeSGWI4YWGAtbekEYF7nDWU84zlJlKQO3Q6Tsi9kjA7VLEjekZjs/o52LZ0RjRQ=='

async function play(account = 'gagxi.wam', pos) {
  let browser = null
  const position = pos * 100
  try {
    await checkLicense()
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
      timeout: 90 * 1000,
      userDataDir: './tmp/' + account,
    }

    browser = await puppeteer.launch(params)
    const page = await browser.newPage()
    await page.setDefaultTimeout(90 * 1000)
    await page.setViewport({ width: 1280, height: 768 })
    page.on('console', (consoleObj) => {
      if (consoleObj.text().indexOf('inner-') === 0) {
        const key = consoleObj.text().replace('inner-', '')
        console.log(i18n.__(key), new Date())
      }
    })

    const loginURL = 'https://play.farmersworld.io/'
    await page.goto(loginURL, { waitUntil: 'networkidle0' })

    await page.waitForSelector('button.login-button')
    console.log(i18n.__('Login Page Load'), new Date())

    await page.waitForTimeout(2000)
    await page.click('button.login-button')
    await page.waitForTimeout(2000)
    await page.click('img[alt="wax-cloud-wallet"]')

    await page.waitForSelector('div.container__header--tilte')
    console.log(i18n.__('Login Success'), new Date())
    await page.waitForTimeout(10000)
    await page.click('div.game-container')
    while (true) {
      await checkLicense()
      await repair(page, account)
      await energy(page, account)
      await s10()
    }
  } catch (err) {
    console.log(`❌ Error: ${err}`)
  } finally {
    await browser.close()
  }
}

async function checkLicense() {
  const privateKey = `-----BEGIN PRIVATE KEY-----
MIIBUwIBADANBgkqhkiG9w0BAQEFAASCAT0wggE5AgEAAkEA4vdQJILtEPcp+5YP
z8UQbOmQNvt6TAZeWWqmAfBtHHlqGSJo4ZB2dJNqFYMk/eJwBXeFQGO6UQD955qw
XFZsvQIDAQABAkAosFegxAwF/5l6LfPVtql0LQcapEjPelDNzO3H6TdWZCNYFcKo
CLkyiU6hdZOEX79hRb17KvHhiwCki6WT3qqNAiEA/LTDINTlFQ0UeQAAAJkC/F+i
bBSHo7u/KsGQ01KtvUcCIQDl7KkhW0a1uO63U4T+qAr4TKARrYoB9b3jSEjf8jr3
2wIgCVPWu/h/uCYyckDovxzmulABW8HqO8XrSXW5lcNAfHMCID9517OSzHGs7ZKF
J0lawTSNiv92Zoxl+Jd/xEa3TBpTAiAz5CXp/aKt6n5rW2pr2SJZvep0uhJIDx/O
SvlFMOI1oQ==
-----END PRIVATE KEY-----
`
  let last = 0
  try {
    const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(encrypted, 'base64'))
    last = Number.parseInt(decrypted)
  } catch (error) {
    // console.log(i18n.__('Authorization Expired'))
  }

  if (new Date().getTime() > last) {
    console.log(i18n.__('Authorization Expired'))
    const response = await prompts({
      type: 'text',
      name: 'license',
      message: i18n.__('Enter your license:'),
      validate: (value) => {
        if (value.length == 88) {
          return true
        }
        if (value.includes('==')) {
          return true
        }
        return i18n.__('Invalid license %s', value)
      },
    })
    encrypted = response.license
    try {
      const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(encrypted, 'base64'))
      const last = Number.parseInt(decrypted)
      if (new Date().getTime() > last) {
        throw new Error(i18n.__('Authorization Expired'))
      } else {
        console.log(i18n.__('Authorization'))
      }
    } catch (error) {
      throw new Error(i18n.__('Authorization Expired'))
    }
  } else {
    console.log(i18n.__('Expire time'), new Date(last))
  }
}
//
async function energy(page, account = 'gagxi.wam') {
  if (isMint) {
    isMint = false
    console.log(i18n.__('Energy Check'), new Date())
    await page.click('div.game-container')
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

    const res = await axios.post('https://api.wax.alohaeos.com/v1/chain/get_table_rows', data)
    if (res.status === 200) {
      const json = res.data
      let last = json['rows'][0]['max_energy'] - json['rows'][0]['energy']
      if (maxenergy) {
        last = maxenergy - json['rows'][0]['energy']
      }
      if (last > 0) {
        console.log(i18n.__('Energy', last), new Date())
        await page.click('img.resource-energy--plus[alt="plus"]')
        await page.waitForTimeout(3000)
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
          await page.waitForSelector('div.flash-message-content')
          console.log(i18n.__('Mine Success'), new Date())
        }
        await s(5)
        await page.click('div.game-container')
      }
    }
  }
}

// 
async function repair(page) {
  process.stdout.write(i18n.__('Check') + new Date() + '\r')
  for (let index = 0; index < 24; index++) {
    const tools = await page.$('img[alt="' + index + '"]')
    if (tools) {
      await page.click('img[alt="' + index + '"]')
      await page.waitForTimeout(500)
      let isClick = await page.$$eval('div.plain-button', (elements) => {
        for (const ele of elements) {
          if (ele.innerText.includes('Mine') && !ele.className.includes('disabled')) {
            console.log('inner-Mine')
            ele.click()
            return true
          }
        }
        return false
      })
      if (isClick) {
        await page.waitForSelector('div.flash-message-content')
        console.log(i18n.__('Mine Success'), new Date())
        isMint = true
        await page.waitForTimeout(1000)
        await page.click('div.game-container')
      }
    }
  }

  for (let index = 0; index < 24; index++) {
    const tools = await page.$('img[alt="' + index + '"]')
    if (tools) {
      await page.click('img[alt="' + index + '"]')
      await page.waitForTimeout(500)
      let isClick = await page.$$eval('div.plain-button', (elements) => {
        for (const ele of elements) {
          if (ele.innerText.includes('Claim') && !ele.className.includes('disabled')) {
            console.log('inner-Claim')
            ele.click()
            return true
          }
        }
        return false
      })
      if (isClick) {
        await page.waitForSelector('div.flash-message-content')
        console.log(i18n.__('Claim Success'), new Date())
        isMint = true
        await page.waitForTimeout(1000)
        await page.click('div.game-container')
      }
    }
  }

  // 
  for (let index = 0; index < 24; index++) {
    const tools = await page.$('img[alt="' + index + '"]')
    if (tools) {
      await page.click('img[alt="' + index + '"]')
      await page.waitForTimeout(500)
      let isClick = await page.$$eval('div.plain-button', (elements) => {
        for (const ele of elements) {
          if (ele.innerText.includes('Repair') && !ele.className.includes('disabled')) {
            console.log('inner-Repair')
            ele.click()
            return true
          }
        }
        return false
      })
      if (isClick) {
        await page.waitForSelector('div.flash-message-content')
        console.log(i18n.__('Repair Success'), new Date())
        await page.waitForTimeout(1000)
        await page.click('div.game-container')
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
          await play(account, position)
        }
      } catch (error) {
        console.log(i18n.__('Offline'), new Date())
        await s30()
      }
    }
  } catch (error) {
    console.log(error)
  }
})()
