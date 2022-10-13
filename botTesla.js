require("dotenv").config();

const { Telegraf, Telegram } = require("telegraf")

const TOKEN = process.env.TOKEN || '';

const ID_BOT = process.env.ID_BOT || '';


const config = require("./config")
const db = require("./veritabani/db")
const fs = require("fs")
const {randomResim, Degisken, ArtiEksi, HusnuEhedov, kullaniciProfil} = require("./eklenti")
const telegram = new Telegram(process.env.TOKEN)
const bot = new Telegraf(process.env.TOKEN)
const path = require("path")
const dbfile = path.resolve(__dirname, "./veritabani/db.json")


let oyunDurumuHusnuEhedov = {}

/// /// /// /// /// /// ///  <!-- VERİTABANI SUPERGROUP(-100) İD ÇEKME --> /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// 

bot.command("txt", async (ctx) => {
    fs.readFile(dbfile, 'utf8', async function(err, doc) {
        var comments = doc.match(/-\d+/g);
        var comments = doc.match(/-100\d+/g);
        if (comments && comments.length > 0) {
            const arr = [];
            for (let i in comments) {
                ctx.telegram.getChat(comments[i]).then(async function (result) {
                    const Usercount = await ctx.telegram.getChatMembersCount(result.id)
                    const text = JSON.stringify(`${result.title} | ${result.id} | UserSayı: ${Usercount}`).replace(/"/g, '')
                    arr.push(text);
                    const stream = fs.createWriteStream('./gruplar.txt');
                    stream.write(arr.join('\n'))
                })
            }
            await bot.telegram.sendDocument(ctx.chat.id, {
                source: './gruplar.txt'
            }, {
                filename: 'gruplar.txt',
                caption: `<b>Grup Döküman:  ${comments.length}</b>`,
                parse_mode: 'HTML'
            })
        } else {
            ctx.reply('Botda hələ heç bir oyun oynanılmayıb.')
        }
    })
});

bot.command("qrupsayı", async (ctx) => {
    fs.readFile(dbfile, 'utf8', async function(err, doc) {
        var comments = doc.match(/-100\d+/g);
        if (comments && comments.length > 0) {
            await ctx.replyWithHTML(`<i>Qrup Sayı:  ${comments.length}</i>`)
        } else {
            ctx.reply('Botda hələ heç bir oyun oynanılmayıb.')
        }
    })
});


/// /// /// /// /// /// ///  <!-- CONST SABİT TANIMLANANLAR --> /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// 

const OyunYaratHusnuEhedov = chatId => {
	oyunDurumuHusnuEhedov[chatId] = {
		timeouts: {},
		guessMessage: null,
		currentRound: null,
		currentTime: 0, 
		answersOrder: []
	}
	return oyunDurumuHusnuEhedov[chatId]
}

const ozelMesaj = isGroup => Degisken(`
    *Salam, Mən təxmin yaş oyun botuyam, Vaxtınızı daha da əyləncəli keçirmək üçün\nməni qrupuna əlavə et 🥳*
    ${isGroup ? "" : "\n*Əsas əmrlərin siyahısı üçün ➡️ /help*"}
`)


const YasOyunBaslat = () => {  // OYUN RESİM ALMASI GEREK DOSYA KONUM 
	let imagePath = "./resimler"
	let fimeName = randomResim(fs.readdirSync(imagePath))
	let age = Number(fimeName.match(/^(\d+)/)[1])
	return {
		age: age,
		photo: `${imagePath}/${fimeName}`
	}
}
const NesneYenileHusnuEhedov = (obj, f) => {
	let index = 0
	for (let key in obj) {
		f(key, obj[key], index)
		index++
	}
}
const dbChatAlHusnuEhedov = chatId => {  // CHAT ID ALMASI
	let data = {
		isPlaying: true,
		members: {}
	}
	db.insert(chatId, data)
}
const dbUserAlHusnuEhedov = firstName => {  // KULLANICI ADI, PUAN ALMASI
	return {
		firstName: firstName,
		isPlaying: true,
		answer: null,
		gameScore: 0,
		totalScore: 0
	}
}
const getChat = chatId => {
	return db.get(chatId)
}
const OyunDurdurHusnuEhedov = (ctx, chatId) => {
	let chat = getChat(chatId)
	if (chat && chat.isPlaying) {
		if (oyunDurumuHusnuEhedov[chatId] && oyunDurumuHusnuEhedov[chatId].timeouts) {
			for (let key in oyunDurumuHusnuEhedov[chatId].timeouts) {
				clearTimeout(oyunDurumuHusnuEhedov[chatId].timeouts[key])
			}
		}
		chat.isPlaying = false
		let top = []
		NesneYenileHusnuEhedov(chat.members, (memberId, member, memberIndex) => {
			if (member.isPlaying) {
				top.push({
					firstName: member.firstName,
					score: member.gameScore
				})

				Object.assign(member, {
					answer: null,
					isPlaying: false,
					gameScore: 0
				})
			}
		})
		db.update(chatId, ch => chat)
		if (top.length > 0) {
			ctx.replyWithMarkdown(Degisken(`
				*❗ Oyun bitdi 🥳*\n\n*🏆 Qaliblər:*

				${top.sort((a, b) => b.score - a.score).map((member, index) => `${["🥇","🎖","🏅"][index] || "🔸"} ${index + 1}. *${member.firstName}*: ${member.score} ${HusnuEhedov(member.score, "puan 🎁", "puan 🎁", "puan 🎁")}`).join("\n")}
				
				
				*/game əmri ilə oyunu yenidən başlatın ♻️*
			`))
		}
	}
	else {
		ctx.reply("🆘 Oyun başlamadı... 🙅🏻\nOyunu başlatmaq üçün /game")
	}
}
const RaundMesajHusnuEhedov = (chatId, round, time) => {
	let chat = getChat(chatId)
	let answers = []
	NesneYenileHusnuEhedov(chat.members, (memberId, member, memberIndex) => {
		if (member.isPlaying && member.answer !== null) {
			answers.push({
				answer: member.answer,
				firstName: member.firstName,
				memberId: Number(memberId)
			})
		}
	})
	answers = answers.sort((a, b) => oyunDurumuHusnuEhedov[chatId].answersOrder.indexOf(a.memberId) - oyunDurumuHusnuEhedov[chatId].answersOrder.indexOf(b.memberId))

	return Degisken(`
		*🎯 Raund ${round + 1}/${process.env.RAUND_SAYI}*
		❓ Sizcə bu şəxsin neçə yaşı var
		${answers.length > 0 ? 
			`\n${answers.map((member, index) => `${index + 1}. *${member.firstName}*: ${member.answer}`).join("\n")}\n`
			:
			""
		}
		${"◾️".repeat(time)}${"▫️".repeat(config.emojiSaniye - time)}
	`)
}
const OyunHusnuEhedov = (ctx, chatId) => {
	let gameState = OyunYaratHusnuEhedov(chatId)
	let startRound = async round => {
		let person = YasOyunBaslat()
		let rightAnswer = person.age
		let guessMessage = await ctx.replyWithPhoto({
			source: person.photo,
		}, {
			caption: RaundMesajHusnuEhedov(chatId, round, 0),
			parse_mode: "Markdown"
		})
		gameState.currentTime = 0
		gameState.guessMessageId = guessMessage.message_id
		gameState.currentRound = round

		let time = 1
		gameState.timeouts.timer = setInterval(() => {
			gameState.currentTime = time
			telegram.editMessageCaption(
				ctx.chat.id,
				guessMessage.message_id,
				null,
				RaundMesajHusnuEhedov(chatId, round, time),
				{
					parse_mode: "Markdown"
				}
			)
			time++
			if (time >= (config.emojiSaniye + 1)) clearInterval(gameState.timeouts.timer)
		}, process.env.SANIYE / (config.emojiSaniye + 1))
		
		gameState.timeouts.round = setTimeout(() => {
			let chat = getChat(chatId)
			let top = []
			NesneYenileHusnuEhedov(chat.members, (memberId, member, memberIndex) => {
				if (member.isPlaying) {
					let addScore = member.answer === null ? 0 : rightAnswer - Math.abs(rightAnswer - member.answer)
					chat.members[memberId].gameScore += addScore
					chat.members[memberId].totalScore += addScore
					top.push({
						firstName: member.firstName,
						addScore: addScore,
						answer: member.answer
					})
					member.answer = null
					db.update(chatId, ch => chat)
				}
			})
			db.update(chatId, ch => chat)
			
			if (!top.every(member => member.answer === null)) {
				ctx.replyWithMarkdown(
					Degisken(`
						👤 Şəkildəki şəxs: *${rightAnswer} ${HusnuEhedov(rightAnswer, "yaşında", "yaşında", "yaşında")}*\n\n*🎯 Xal qazanan oyunçular:*

						${top.sort((a, b) => b.addScore - a.addScore).map((member, index) => `${["🥇","🎖","🏅"][index] || "🔸"} ${index + 1}. *${member.firstName}*: ${ArtiEksi(member.addScore)}`).join("\n")}
					`),
					{
						reply_to_message_id: guessMessage.message_id,
					}
				)
			}
			else {
				ctx.reply("Küsdüm mənimlə oynamırsız😒 oyunu dayandırdım ❕")
				OyunDurdurHusnuEhedov(ctx, chatId)
				return
			}

			if (round === process.env.RAUND_SAYI - 1) {
				gameState.timeouts.OyunDurdurHusnuEhedov = setTimeout(() => {
					OyunDurdurHusnuEhedov(ctx, chatId)
				}, 1000)
			}
			else {
				gameState.answersOrder = []
				gameState.timeouts.afterRound = setTimeout(() => {
					startRound(++round)
				}, 2500)
			}
		}, process.env.SANIYE)
	}
	gameState.timeouts.beforeGame = setTimeout(() => {
		startRound(0)
	}, 1000)
}
/// /// /// /// /// /// ///  <!-- CONST SABİT TANIMLANANLAR SON--> /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// 





bot.command("game", (ctx) => {
	let message = ctx.update.message
	if (message.chat.id < 0) {
		let chatId = message.chat.id
		let chat = getChat(chatId)
		if (chat) {
			if (chat.isPlaying) {
				return ctx.reply("❗️ Oyun hal-hazırda aktivdir, Dayandırmaq üçün /stop")
			}
			else {
				chat.isPlaying = true
				for (let key in chat.members) {
					let member = chat.members[key]
					member.gameScore = 0
				}
				db.update(chatId, ch => chat)
			}
		}
		else {
			dbChatAlHusnuEhedov(chatId)
		}
		ctx.replyWithHTML(`<b><a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a> tərəfindən yaş oyunu başladı 🥳</b>`)
		OyunHusnuEhedov(ctx, chatId)
	}
	else {
		ctx.reply("🛑 Bu əmr qruplar üçün etibarlıdır")
	}
})



bot.command("stop", (ctx) => {
    let message = ctx.update.message
    if (message.chat.id < 0) {
        let chatId = message.chat.id
        OyunDurdurHusnuEhedov(ctx, chatId)
    }
    else {
        ctx.reply("🛑 Bu əmr qruplar üçün etibarlıdır")
    }
})


/// /// /// /// /// /// ///  <!-- GRUB KULLANICI RATING --> /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// 

bot.command("top", (ctx) => {
	let message = ctx.update.message
	if (message.chat.id < 0) {
		let chatId = message.chat.id
		let chat = getChat(chatId)
		if (chat) {
			let top = []
			NesneYenileHusnuEhedov(chat.members, (memberId, member, memberIndex) => {
				top.push({
					firstName: member.firstName,
					score: member.totalScore
				})

				Object.assign(member, {
					answer: null,
					isPlaying: false,
					gameScore: 0
				})
			})
			if (top.length > 0) {
				ctx.replyWithMarkdown(Degisken(`
*🏆 Bu qrup üzrə ən yaxşı oyunçular*

${top.sort((a, b) => b.score - a.score).slice(0, 20).map((member, index) => `${["","",""][index] || ""} ${index + 1}) *${member.firstName}*: ${member.score} ${HusnuEhedov(member.score, "puan🎁", "puan🎁", "puan🎁")}`).join("\n")}
				`))
			}
			else {
				ctx.reply("❗️ Bu qrupda heç oyun oynamadınız")
			}
		}
		else {
			ctx.reply("🛑 Bu əmr qruplar üçün etibarlıdır")
		}
	}
	else {
		ctx.reply("🛑 Bu əmr qruplar üçün etibarlıdır")
	}
})
/// /// /// /// /// /// ///  <!-- GRUB KULLANICI RATING SON --> /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// 





/// /// /// /// /// /// ///  <!-- GLOBAL KULLANICI RATING --> /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// 
bot.command("g", (ctx) => {
    fs.readFile(dbfile, 'utf8', async function(err, doc) {
        var comments = doc.match(/-100\d+/g)
        let top = []
        if (comments && comments.length > 0) {
            for (let i in comments) {
                let chatId = comments[i]
                let chat = getChat(chatId)
                NesneYenileHusnuEhedov(chat.members, (memberId, member, memberIndex) => {
                    top.push({
                        firstName: member.firstName,
                        score: member.totalScore
                    })

                    Object.assign(member, {
                        answer: null,
                        isPlaying: true,
                        gameScore: 0
                    })
                })
            }
            if (top.length > 0) {
                ctx.replyWithHTML(Degisken(`
     <b>🏆 Qruplar üzrə ən yaxşı oyunçular</b>\n
${(top).sort((a, b) => b.score - a.score).slice(0, 20).map((member, index) => `${["🥇","🥈","🥉"][index] || "🎲"} ${index + 1}) <b><i>${member.firstName} → ${member.score} ${HusnuEhedov(member.score, "puan", "puan", "puan")}</i></b>`).join("\n")}
                `))
            }
        }
    })
})
/// /// /// /// /// /// ///  <!-- GLOBAL KULLANICI RATING SON --> /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// 



bot.command("help", (ctx) => {
    return ctx.replyWithMarkdown(Degisken(`
        *Salam! "Təxmin" oyunu üçün yaradırmış bir botam 🤖*\n🆘 *Bot yalnız qruplar üçün nəzərdə tutulub!*\n\n_ℹ️ Qaydalar budur: Mən sizə şəkillər atıram və siz kateqoriyaya uyğun rəqəmlər təxmin etməlisiniz🕵🏼‍♂️ Əvvəlcə botu qrupa əlavə edin və qrupda media icazəni aktiv edin! və ya botu admin edin_🗣\n_sonra əmrlər ilə oyuna başlaya bilərsiniz_🎯\n
          *Əsas əmrlərin siyahısı ⬇️*\n\n🎲 /game - _Oyunu başlatmaq_\n⛔️ /stop - _Oyunu dayandırmaq_\n📊 /top - _Oyunçuların xalları göstərir_\n🌍 /g - _Qruplar üzrə xalları göstərir_\nℹ️ /help - _Sizə kömək edəcək_\n👤 /info - _İstifadəçi haqqında məlumatı göstərir_\n🆔 /id - _Qrup və istifadəçi ID nömrəsi göstərir_`))
})

bot.command("info", async (ctx) => {
    const Id = ctx.message.reply_to_message ? ctx.message.reply_to_message.from.id : ctx.message.from.id;
    const messageId = ctx.message.reply_to_message ? ctx.message.reply_to_message.message_id : null;
    const photoInfo = await ctx.telegram.getUserProfilePhotos(Id);
    const photoId = photoInfo.photos[0]?.[0]?.file_id;
    const getUserInfo = await ctx.telegram.getChat(Id);
    const getUser = [getUserInfo].map(kullaniciProfil).join(', ')
    if (photoId) {
        return ctx.replyWithPhoto(photoId, { caption: getUser, parse_mode: 'HTML', reply_to_message_id: messageId  })
    } else {
        return ctx.replyWithHTML(getUser,  { reply_to_message_id: messageId })
    }
});

bot.command('id', async (ctx, next) => {
	if (ctx.chat.type !== "supergroup") return null;
    const chatBio = ctx.chat.description
    await ctx.telegram.sendMessage(ctx.chat.id, `<b>Qrup</b>\n🆔:<code>${ctx.chat.id}</code>\nAd: <code>${ctx.chat.title}</code>`, { parse_mode: 'HTML' }) 
    return next();
});



/// /// /// /// /// /// ///  <!-- BOT START MENÜ --> /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// ///

bot.start(async (ctx) => {
    await ctx.replyWithMarkdown(ozelMesaj(ctx.update.message.chat.id < 0),{
        reply_markup:{
            inline_keyboard:[
                [{text:'➕ Botu qrupa əlavə edin ➕', url:`https://t.me/${process.env.BOT_ISMI}?startgroup=true`}],
                [{text:'🤖 Digər Botlar', url:`t.me/Rahid_44`},{text:'Qruplar 💎', callback_data:'vip'}]
            ]
        }
    })
})

bot.action('start', ctx=>{
    ctx.deleteMessage()
    ctx.replyWithMarkdown(`*Salam, Mən təxmin yaş oyun botuyam, Vaxtınızı daha da əyləncəli keçirmək üçün\nməni qrupuna əlavə et 🥳\n\n**Əsas əmrlərin siyahısı üçün ➡️ /help*
        `,{
        reply_markup:{
            inline_keyboard:[
                [{text:'➕ Botu qrupa əlavə edin ➕', url:`t.me/${process.env.BOT_ISMI}?startgroup=true`}],
                [{text:'🤖 Digər Botlar', url:`t.me/Rahid_44`},{text:'Qruplar 💎', callback_data:'vip'}]
            ]
        }
    })
})



bot.action('vip', ctx=>{
    ctx.deleteMessage()
    ctx.replyWithMarkdown(`*🇦🇿 Qruplar*`,{
        reply_markup:{
            inline_keyboard:[
                [{text:'🇦🇿 Qruplar', callback_data:'AZ'}],
                [{text:'🇦🇿 Digər Qruplar', callback_data:'TR'}],
                [{text:'🔙 Geri', callback_data:'start'}]
            ]
        }
    })
})

// AZƏRBAYCAN GRUP DÜYMƏLƏRİ
bot.action('AZ', ctx=>{
    ctx.deleteMessage()
    ctx.replyWithMarkdown(`*🇦🇿 Qruplar*`,{
        reply_markup:{
            inline_keyboard:[
                [{text:'1) 𒆜 𝐂𝐄𝐍𝐔𝐁 𝐙𝐎𝐍𝐀𝐒𝐈 𒆜', url:'t.me/Cenublar'}],
                [{text:'2) 乂🖤ℙ𝕒𝕪ı𝕫 𝔾𝕖𝕔𝕖𝕤𝕚🖤乂', url:'t.me/gecepayizi'}],
                [{text:'🔙 Geri', callback_data:'vip'}]
            ]
        }
    })
})

// TÜRK GRUP DÜYMƏLƏRİ
bot.action('TR', ctx=>{
    ctx.deleteMessage()
    ctx.replyWithMarkdown(`
*🇦🇿 Digər Qruplar*
       `,{
        reply_markup:{
            inline_keyboard:[
                [{text:'1) 𒆜 𝘿𝘼𝙍𝙆 𝙍𝙀𝙂𝙄𝙊𝙉 𒆜', url:'t.me/Dark_Region'}],
                [{text:'2) ☬ 𝐆◉𝐥𝐝 𝐆𝐫𝐨𝐮𝐩 ☬', url:'t.me/GG_teams'}],
                [{text:'🔙 Geri', callback_data:'vip'}]
            ]
        }
    })
})

/// /// /// /// /// /// ///  <!-- BOT START MENÜ SON --> /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// 





bot.on("message", async (ctx) => {
	let message = ctx.update.message
	if (message.chat.id < 0) {
		let chatId = message.chat.id
		let fromId = message.from.id
		let chat = getChat(chatId)
		if (
			chat && 
			chat.isPlaying && 
			(chat.members[fromId] === undefined || chat.members[fromId].answer === null) && 
			oyunDurumuHusnuEhedov && 
			/^-?\d+$/.test(message.text)
		) {
			let firstName = message.from.first_name
			let answer = Number(message.text)
			if (answer <= 0 || answer > 100) {
				return ctx.reply(
					"❗ Cavab limiti (1 - 100)",
					{
						reply_to_message_id: ctx.message.message_id,
					}
				)
			}
			if (!chat.members[fromId]) { 
				chat.members[fromId] = dbUserAlHusnuEhedov(firstName)
			}
			Object.assign(chat.members[fromId], {
				isPlaying: true,
				answer: answer,
				firstName: firstName
			})
			oyunDurumuHusnuEhedov[chatId].answersOrder.push(fromId)

			db.update(chatId, ch => chat)

			telegram.editMessageCaption(
				chatId,
				oyunDurumuHusnuEhedov[chatId].guessMessageId,
				null,
				RaundMesajHusnuEhedov(chatId, oyunDurumuHusnuEhedov[chatId].currentRound, oyunDurumuHusnuEhedov[chatId].currentTime),
				{
					parse_mode: "Markdown"
				}
			)
		}
		else if (message.new_chat_member && message.new_chat_member.id === process.env.ID_BOT) { /// Bot Yeni Qruba Eklendi Mesaj
			ctx.replyWithMarkdown(ozelMesaj(true))
		}
	}
})


// Olumsuz Hata versede çalışmaya devam eder
bot.catch((err) => {
    console.log('Error: ', err)
})

// Botun nickname alan kod
bot.telegram.getMe().then(botInfo => {
    bot.options.username = botInfo.username
    console.log(`Sistem Aktivləşdirildi => ${bot.options.username}`)
})

bot.launch();