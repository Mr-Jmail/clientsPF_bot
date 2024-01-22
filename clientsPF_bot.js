const path = require("path")
require("dotenv").config({path: path.join(__dirname, ".env")})
const cron = require("node-cron")
const { startReplier, addReminderToDb, getReminders } = require("./functions")
const { Telegraf, Scenes, session } = require("telegraf")

const bot = new Telegraf(process.env.botToken)

const addReminderScene = require("./scenes/addReminderScene")

const stage = new Scenes.Stage([addReminderScene])

bot.use(session())
bot.use(stage.middleware())

bot.start(ctx => startReplier(ctx))

addReminderToDb("третье напоминание", "13.12.2024", "В работе")
// ;(async function() {console.log(await getReminders("23.01.2024"))})()

bot.command("addReminder", ctx => ctx.scene.enter("addReminderScene"))

bot.launch()