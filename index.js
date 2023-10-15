import plugin from '../../lib/plugins/plugin.js'
import common from '../../lib/common/common.js'
import fs from 'fs'
if (!global.segment) {
  global.segment = (await import('oicq')).segment
}
export class How2CookPlugin extends plugin {
  constructor () {
    super({
      /** 功能名称 */
      name: 'HowToCook',
      /** 功能描述 */
      dsc: '程序员做饭秘籍',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 6,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#?随机菜单',
          /** 执行方法 */
          fnc: 'randomDishes'
        },
        {
          /** 命令正则匹配 */
          reg: '^#?吃什么呢$',
          /** 执行方法 */
          fnc: 'eatWhat'
        }
      ]
    })
  }

  async randomDishes (e) {
    let category = e.msg.replace(/^#?随机菜单/, '').trim()
    if (!category) {
      category = Object.keys(categoryMap)[Math.floor(Math.random() * Object.keys(categoryMap).length)]
    }
    if (!categoryReverseMap[category] && !categoryMap[category]) {
      await e.reply('没有这种菜哦，只有海鲜、早餐、调味品、甜品、饮品、肉菜、半成品、汤、主食和素食喵~')
      return false
    }
    const { contents, details } = getDishesByCategory(category)
    await e.reply(contents, true)
    const details2Forward = []
    details.forEach(d => {
      details2Forward.push(d.md)
      if (d.images) {
        d.images.forEach(image => {
          details2Forward.push(segment.image(fs.createReadStream(image)))
        })
      }
    })
    await e.reply(await common.makeForwardMsg(e, details2Forward, e.msg))
  }

  async eatWhat (e) {
    let now = getTimeOfDay()
    switch (now) {
      case 'morning': {
        const { contents, details } = getDishesByCategory('breakfast')
        await e.reply(`现在是早上，可以吃${contents}喵～`, true)
        const details2Forward = []
        details.forEach(d => {
          details2Forward.push(d.md)
          if (d.images) {
            d.images.forEach(image => {
              details2Forward.push(segment.image(fs.createReadStream(image)))
            })
          }
        })
        await e.reply(await common.makeForwardMsg(e, details2Forward, e.msg))
        break
      }
      case 'noon': {
        const { contents: contents1, details: details1 } = getDishesByCategory('vegetable_dish')
        const { contents: contents2, details: details2 } = getDishesByCategory('staple')
        const { contents: contents3, details: details3 } = getDishesByCategory('drink')
        await e.reply(`现在是中午，可以吃${[contents1, contents2, contents3].join('\n')}喵～`, true)
        const details2Forward = []
        let details = [...details1, ...details2, ...details3]
        details.forEach(d => {
          details2Forward.push(d.md)
          if (d.images) {
            d.images.forEach(image => {
              details2Forward.push(segment.image(fs.createReadStream(image)))
            })
          }
        })
        await e.reply(await common.makeForwardMsg(e, details2Forward, e.msg))
        break
      }
      case 'evening': {
        const { contents: contents1, details: details1 } = getDishesByCategory('vegetable_dish')
        const { contents: contents2, details: details2 } = getDishesByCategory('meat_dish')
        const { contents: contents3, details: details3 } = getDishesByCategory('staple')
        const { contents: contents4, details: details4 } = getDishesByCategory('aquatic')
        const { contents: contents5, details: details5 } = getDishesByCategory('dessert')
        const { contents: contents6, details: details6 } = getDishesByCategory('drink')
        await e.reply(`现在是晚上，可以吃${[contents1, contents2, contents3, contents4, contents5, contents6].join('，')}喵～`, true)
        const details2Forward = []
        let details = [...details1, ...details2, ...details3, ...details4, ...details5, ...details6]
        details.forEach(d => {
          details2Forward.push(d.md)
          if (d.images) {
            d.images.forEach(image => {
              details2Forward.push(segment.image(fs.createReadStream(image)))
            })
          }
        })
        await e.reply(await common.makeForwardMsg(e, details2Forward, e.msg))
        break
      }
    }
  }
}

const categoryMap = {
  aquatic: '海鲜',
  breakfast: '早餐',
  condiment: '调味品',
  dessert: '甜品',
  drink: '饮品',
  meat_dish: '肉菜',
  'semi-finished': '半成品',
  soup: '汤',
  staple: '主食',
  vegetable_dish: '素食'
}
let categoryReverseMap = {}
Object.keys(categoryMap).forEach(k => {
  categoryReverseMap[categoryMap[k]] = k
})
const _path = process.cwd()
const fullPath = fs.realpathSync(`${_path}/plugins/howtocook/HowToCook`)
function getDishesByCategory (category, count = 1) {
  if (!categoryMap[category]) {
    category = categoryReverseMap[category]
  }
  let categoryPath = `${fullPath}/dishes/${category}`
  const files = fs.readdirSync(categoryPath)
  let total = files.length
  let seeds = generateRandomIntegers(total, count)
  let chosen = seeds.map(s => files[s])
  let contents = chosen.map(c => c.replace('.md', '')).join('，')
  let details = seeds.map(s => {
    if (files[s].endsWith('.md')) {
      return {
        md: fs.readFileSync(`${fullPath}/dishes/${category}/${files[s]}`, 'utf8')
      }
    } else {
      let md = fs.readdirSync(`${fullPath}/dishes/${category}/${files[s]}`)
        .filter(f => f.endsWith('.md'))[0]
      md = fs.readFileSync(`${fullPath}/dishes/${category}/${files[s]}/${md}`, 'utf8')
      const images = fs.readdirSync(`${fullPath}/dishes/${category}/${files[s]}`)
        .filter(f => !f.endsWith('.md'))
        .map(f => `${fullPath}/dishes/${category}/${files[s]}/${f}`)
      return {
        md, images
      }
    }
  })
  return {
    contents, details
  }
}

function generateRandomIntegers (max, n = 1) {
  let randIntegers = []

  for (let i = 0; i < n; i++) {
    let rand = Math.floor(Math.random() * max)

    while (randIntegers.includes(rand)) {
      rand = Math.floor(Math.random() * max)
    }

    randIntegers.push(rand)
  }

  return randIntegers
}

function getTimeOfDay (currentTime = new Date()) {
  let hours = currentTime.getHours()

  if (hours >= 5 && hours < 10) {
    return 'morning'
  } else if (hours >= 10 && hours < 15) {
    return 'noon'
  } else {
    return 'evening'
  }
}

export async function makeForwardMsg (e, msg = [], dec = '') {
  let nickname = Bot.nickname
  if (e.isGroup) {
    try {
      let info = await Bot.getGroupMemberInfo(e.group_id, Bot.uin)
      nickname = info.card || info.nickname
    } catch (err) {
      console.error(`Failed to get group member info: ${err}`)
    }
  }
  let userInfo = {
    user_id: Bot.uin,
    nickname
  }

  let forwardMsg = []
  msg.forEach((v) => {
    forwardMsg.push({
      ...userInfo,
      message: v
    })
  })
  let is_sign = true
  /** 制作转发内容 */
  if (e.isGroup) {
    forwardMsg = await e.group.makeForwardMsg(forwardMsg)
  } else if (e.friend) {
    forwardMsg = await e.friend.makeForwardMsg(forwardMsg)
  } else {
    return false
  }
  let forwardMsg_json = forwardMsg.data
  if (typeof (forwardMsg_json) === 'object') {
    if (forwardMsg_json.app === 'com.tencent.multimsg' && forwardMsg_json.meta?.detail) {
      let detail = forwardMsg_json.meta.detail
      let resid = detail.resid
      let fileName = detail.uniseq
      let preview = ''
      for (let val of detail.news) {
        preview += `<title color="#777777" size="26">${val.text}</title>`
      }
      forwardMsg.data = `<?xml version="1.0" encoding="utf-8"?><msg brief="[聊天记录]" m_fileName="${fileName}" action="viewMultiMsg" tSum="1" flag="3" m_resid="${resid}" serviceID="35" m_fileSize="0"><item layout="1"><title color="#000000" size="34">转发的聊天记录</title>${preview}<hr></hr><summary color="#808080" size="26">${detail.summary}</summary></item><source name="聊天记录"></source></msg>`
      forwardMsg.type = 'xml'
      forwardMsg.id = 35
    }
  }
  forwardMsg.data = forwardMsg.data
		.replace(/\n/g, '')
		.replace(/<title color="#777777" size="26">(.+?)<\/title>/g, '___')
		.replace(/___+/, `<title color="#777777" size="26">${dec}</title>`)
  if (!is_sign) {
    forwardMsg.data = forwardMsg.data
      .replace('转发的', '不可转发的')
  }
  return forwardMsg
}
