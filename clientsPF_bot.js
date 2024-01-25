const path = require("path")
require("dotenv").config({path: path.join(__dirname, ".env")})
const date = require("date-fns");
const cron = require("node-cron")
const { startReplier, getReminders, addReminderToDb, findNextDate } = require("./functions")
const { Telegraf, Scenes, session } = require("telegraf")
const chatIdToSend = 2122710278
// const chatIdToSend = 1386450473

const bot = new Telegraf(process.env.botToken)

const addReminderScene = require("./scenes/addReminderScene")
const getRemindersScene = require("./scenes/getRemindersScene")

const stage = new Scenes.Stage([addReminderScene, getRemindersScene])

bot.use(session())
bot.use(stage.middleware())

bot.start(ctx => startReplier(ctx))

bot.command("addReminder", ctx => ctx.scene.enter("addReminderScene"))

bot.command("getReminders", ctx => ctx.scene.enter("getRemindersScene"))

// ;(async function() {
cron.schedule("0 12 * * *", async function() {
    var today = date.format(new Date(), "dd.MM.yyyy")
    var todaysReminders = await getReminders(today)
    if(todaysReminders.length == 0) return await bot.telegram.sendMessage(chatIdToSend, "На сегодня нет никаких напоминаний")
    var workingReminders = todaysReminders.filter(reminder => reminder.status == "В работе")
    var pausedReminders = todaysReminders.filter(reminder => reminder.status == "На паузе")
    
    await bot.telegram.sendMessage(chatIdToSend, `Напоминаний сегодня: ${todaysReminders.length}\nИз них:\n  В работе: ${workingReminders.length}\n  На паузе:${pausedReminders.length}`)
    
    var workingRemindersText = "Напоминания в работе:\n"
    workingReminders.forEach((reminder, idx) => workingRemindersText += `${idx + 1}) ${reminder.text}\n`)
    if(workingReminders.length != 0) await bot.telegram.sendMessage(chatIdToSend, workingRemindersText)

    var pausedRemindersText = "Напоминания на паузе:\n"
    pausedReminders.forEach((reminder, idx) => pausedRemindersText += `${idx + 1}) ${reminder.text}\n`)
    if(pausedReminders.length != 0) await bot.telegram.sendMessage(chatIdToSend, pausedRemindersText)
    
    var todayAfter12 = new Date()
    todayAfter12.setHours(13)
    
    for (var reminder of todaysReminders) {
        var nextDate = await findNextDate(new Date().getDate(), todayAfter12)
        await addReminderToDb(reminder.text, nextDate, reminder.status) 
        console.log(reminder)
    }
})

bot.launch()