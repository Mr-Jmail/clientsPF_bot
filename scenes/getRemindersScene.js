const { Scenes } = require("telegraf");
const { getReminders, startReplier, getReminderById, editReminder, findNextDate } = require("../functions");

const getRemindersScene = new Scenes.BaseScene("getRemindersScene");

getRemindersScene.enter(async ctx => {
    const inline_keyboard = await genNumberKeyboard("getReminders")
    inline_keyboard.push([{text: "Назад", callback_data: "backToStartReplier"}])
    ctx.reply("Выберите день, в который хотите посмотреть напоминания", {reply_markup: {inline_keyboard}})
})

getRemindersScene.action("backToStartReplier", async ctx => await startReplier(ctx))

getRemindersScene.action("backToStart", ctx => ctx.scene.reenter())

getRemindersScene.action(/getReminders/ig, async ctx => {
    var day = ctx.callbackQuery.data.replace("getReminders", "")
    var date = await findNextDate(day)
    var reminders = await getReminders(date)
    const backButton = {text: "Назад", callback_data: "backToStart"}
    if(reminders.length == 0) return await ctx.reply(`На ${date} не добавлено ни одного напоминания`, {reply_markup: {inline_keyboard: [[backButton]]}})
    console.log(reminders)
    var inline_keyboard = await genRemindersKeyboard(reminders, `${day}getReminderId`)
    inline_keyboard.push([backButton])
    await ctx.reply("Выберите нужное напоминание", {reply_markup: {inline_keyboard}});
})

getRemindersScene.action(/getReminderId/ig, async ctx => {
    const [day, reminderId] = ctx.callbackQuery.data.split("getReminderId")
    const backButton = {text: "Назад", callback_data: `getReminders${day}`}
    var reminder = await getReminderById(reminderId)
    if(!reminder) return await ctx.reply("К сожалению этого напоминания нет в базе", {reply_markup: {inline_keyboard: [[backButton]]}})
    await ctx.reply(`Текст (ссылка): "${reminder.text}"\nСтатус: "${reminder.status}"\nДата следующего напоминания: ${reminder.date}`, {reply_markup: {inline_keyboard: [[{text: "Сменить статус", callback_data: `${day}changeStatus${reminderId}`}], [backButton]]}})
})

getRemindersScene.action(/changeStatus/ig, async ctx => {
    const [day, reminderId] = ctx.callbackQuery.data.split("changeStatus")
    var reminder = await getReminderById(reminderId)
    await ctx.reply(`Вы уверены, что для напоминания "${reminder.text}" хотите изменить статус на "${reminder.status == "В работе" ? "На паузе" : "В работе"}"?`, {reply_markup: {inline_keyboard: [[{text: "Да", callback_data: `${day}confirmedChanging${reminderId}`}], [{text: "Назад", callback_data: `${day}getReminderId${reminderId}`}]]}})
})

getRemindersScene.action(/confirmedChanging/ig, async ctx => {
    const [day, reminderId] = ctx.callbackQuery.data.split("confirmedChanging")
    var reminder = await getReminderById(reminderId)
    var newStatus = reminder.status == "В работе" ? "На паузе" : "В работе"
    await editReminder(reminderId, "status", newStatus)
    await ctx.reply(`В напоминании "${reminder.text}" статус сменен на "${newStatus}"`, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: `${day}getReminderId${reminderId}`}]]}})
})

async function genNumberKeyboard(callback_dataBeforeI) {
    const inline_keyboard = []
    
    var row = [];
    for (var i = 1, j = 1; i <= 35; i++) {
        if((i >= 29 && i <= 30) || (i >= 34 && i <= 35)) row.push({ text: ` `, callback_data: `blanked` });
        else row.push({ text: `${j}`, callback_data: `${callback_dataBeforeI}${j++}` });
        if (i % 7 == 0) {
            inline_keyboard.push([...row]);
            row = [];
        }
    }

    return inline_keyboard
}

async function genRemindersKeyboard(reminders, callback_dataBeforeId) {
    const inline_keyboard = []
    reminders.forEach(reminder => inline_keyboard.push([{text: reminder.text, callback_data: `${callback_dataBeforeId}${reminder.id}`}]))
    return inline_keyboard
}

module.exports = getRemindersScene