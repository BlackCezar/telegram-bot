import * as TelegramBot from 'node-telegram-bot-api'
import { appendFile } from 'node:fs'

var telegramToken = "6607259093:AAEI5rmxG3Ndzta7hUHVKC4A6lBXK663qoE"
var bot = new TelegramBot(telegramToken, {
    polling: true
})
var userConfig: {
    [key: number]: {
        activeQuestion: number;
        email: string;
        username: string;
        phone: string;
        nic: string;
        childAge: string;
    }
} = {}

console.log('Bot started')

var questions = [
    'Ваше имя и отчество:',
    'Ваш номер телефона:',
    'Ваш email:',
    'Возраст ребенка:'
]

bot.setMyCommands([{
    command: '/start', description: 'Начать заново',
}, {
    command: '/info', description: 'Информация обо мне'
}, {
    command: '/clear', description: 'Очистить'
}])

function clearInfo(id: number) {
    delete userConfig[id]
    bot.sendMessage(id, `Информация о вас очищена!`);
}

function getInfo(id: number) {
    if (!userConfig[id]) {
        return bot.sendMessage(id, 'Мы пока ничего не знаем о вас!')
    }
    const data = userConfig[id]
    let message = `
    Ваше имя: ${data.username} \n
    Ваш номер телефона ${data.phone} \n
    Ваш email ${data.email} \n
    `
    if (!data.hasChildren) {
        message += `У вас нет ребенка`
    } else {
        message += `Вашему ребенку ${data.childAge}`
    }
    bot.sendMessage(id, message)
}

bot.on("polling_error", console.log);

function onRejectPhone(chatId: number) {
    bot.sendMessage(chatId, questions[userConfig[chatId].activeQuestion - 1]);
}
function onRejectEmail(chatId: number) {
    bot.sendMessage(chatId, questions[userConfig[chatId].activeQuestion - 1]);
}
function onAcceptPhone(chatId: number, msg: any) {
    userConfig[chatId].phone = msg
    sendQuestion(chatId, userConfig[chatId].activeQuestion, {
        reply_markup: {
            remove_keyboard: true
        }
    });
    userConfig[chatId].activeQuestion++;
}
function onAcceptEmail(chatId: number, msg: any) {
    saveEmailAndRequestAge(msg, chatId)
    userConfig[chatId].activeQuestion++;
}




bot.on('callback_query', (msg: any) => {
    const chatId = msg.message.chat.id;

    if (msg.data === 'reject_phone') {
        onRejectPhone(chatId)
    } else if (msg.data.includes('ignore_phone')) {
        onAcceptPhone(chatId, msg.data.split('|')[1])
    } else if (msg.data.includes('ignore_email')) {
        onAcceptEmail(chatId, msg.data.split('|')[1])
    } else if (msg.data.includes('reject_email')) {
        onRejectEmail(chatId)
    } else {
        userConfig[chatId].childAge = msg.data
        sendGift(chatId)
    }
})

function sendGift(chatId: number) {
    var defaultText = `Поздравляем 🌟✨, \n`
    switch (userConfig[chatId].childAge) {
        case '1-3': {
            defaultText += 'Вы получили бесплатную адаптационную неделю на программу Ясли-сад, либо бесплатное занятие на программу «Мама + малыш» - на выбор (контактный номер менеджера 223-38-38)'
            break;
        };
        case '4-7': {
            defaultText += 'Вы получили бесплатный мастер класс в Умка клубе в Бобровом логе, либо субботний комплекс в любом филиале Умка – на выбор (контактный номер менеджера 223-38-38)'
            break;
        }
        case '7-10': {
            defaultText += 'Вы получили бесплатное посещение студии на выбор (контактный номер менеджера +7 (902) 923-19-27)'
            break;
        }
        case '10-14': {
            defaultText += 'Вы получили бесплатное посещение одного мастер-класса студии кулинарнии Умка Шеф  (контактный номер менеджера +7 (902) 923-19-27)'
            break;
        }
        case '14-17': {
            defaultText += 'Вы получили бесплатное посещение одного дня интенсива проекта UmkaProf (курс Профориентации) (контактный номер менеджера +7 (902) 974-15-46)'
            break;
        }
        default: {
            defaultText += `Школа управленческой магии Татьяны Владимировны Андреевой – скидка 10% на курс; либо коуч-сессия - разбор по запросу бизнеса – скидка 10% (контактный номер менеджера 223-38-38)`
        }
    }
    bot.sendMessage(chatId, defaultText)
}

function saveEmailAndRequestAge(email: string, chatId: number) {
    // Enter email and request age of child
    userConfig[chatId].email = email

    sendQuestion(chatId, userConfig[chatId].activeQuestion, {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: '1-3 года',
                    callback_data: '1-3'
                }, {
                    text: '4-7 лет',
                    callback_data: '4-7'
                }, {
                    text: '7-10 лет',
                    callback_data: '7-10'
                }],
                [{
                    text: '10-14 лет',
                    callback_data: '10-14'
                }, {
                    text: '14-17 лет',
                    callback_data: '14-17'
                }],
                [{
                    text: 'Уже выросли',
                    callback_data: '18+'
                }, {
                    text: 'Детей нет',
                    callback_data: 'havnt_child'
                }]
            ],
        }
    });
}
function onMessage(msg: any) {
    const chatId = msg.chat.id;

    if (msg.text === '/clear') return clearInfo(chatId);
    if (msg.text === '/info') return getInfo(chatId)

    console.log(msg)
    if (userConfig[chatId] && msg.text !== '/start') {
        if (msg.contact?.phone_number) {
            userConfig[chatId].phone = msg.contact.phone_number;
        }

        if (userConfig[chatId].activeQuestion === 1) {
            // Enter UserName request Phone
            userConfig[chatId].username = msg.text
            sendQuestion(chatId, userConfig[chatId].activeQuestion, {
                reply_markup: {
                    one_time_keyboard: true,
                    keyboard: [
                        [{
                            text: 'Указать мой номер телефона',
                            request_contact: true
                        }]
                    ]
                }
            });
            userConfig[chatId].activeQuestion++;
        } else if (userConfig[chatId].activeQuestion === 2) {
            if (msg.entities?.find(e => e.type === 'phone_number')) {
                // Enter Phone request Email
                userConfig[chatId].phone = msg.text
                sendQuestion(chatId, userConfig[chatId].activeQuestion, {
                    reply_markup: {
                        remove_keyboard: true
                    }
                });
                userConfig[chatId].activeQuestion++;
            } else if (msg.contact?.phone_number) {
                userConfig[chatId].phone = msg.contact.phone_number
                sendQuestion(chatId, userConfig[chatId].activeQuestion, {
                    reply_markup: {
                        remove_keyboard: true
                    }
                });
                userConfig[chatId].activeQuestion++;
            } else {
                bot.sendMessage(chatId, 'Кажется вы ввели неправильный номер телефона, хотите продолжить?', {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Да',
                                    callback_data: 'ignore_phone|' + msg.text
                                }, {
                                    text: 'Нет',
                                    callback_data: 'reject_phone'
                                }
                            ]
                        ]
                    }
                } satisfies TelegramBot.SendMessageOptions)
            }
        } else if (userConfig[chatId].activeQuestion === 3) {
            if (msg.entities?.find(e => e.type === 'email')) {
                const email = msg.text
                saveEmailAndRequestAge(email, chatId)
                userConfig[chatId].activeQuestion++;
            } else {
                bot.sendMessage(chatId, 'Кажется вы ввели неправильный email, хотите продолжить?', {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Да',
                                    callback_data: 'ignore_email|' + msg.text
                                }, {
                                    text: 'Нет',
                                    callback_data: 'reject_email'
                                }
                            ]
                        ]
                    }
                } satisfies TelegramBot.SendMessageOptions)
            }
        } else if (userConfig[chatId]?.childAge) {
            sendGift(chatId)
        }

    } else {
        userConfig[chatId] = {
            activeQuestion: 1,
            email: '',
            username: '',
            childAge: '',
            phone: '',
            nic: msg.chat.username
        }
        sendQuestion(chatId, 0, {
            reply_markup: {
                remove_keyboard: true
            }
        });
    }
}
bot.on('message', onMessage);


function sendQuestion(chatId: number, questionIndex: number, options?: TelegramBot.SendMessageOptions) {
    bot.sendMessage(chatId, questions[questionIndex], options);
}

setInterval(() => {
    for (const user of Object.values(userConfig)) {
        if (user.username && user.phone && user.email) appendFile(`users.csv`, `${user.username};${user.phone};${user.email};${user.childAge}\n`, () => { })
    }
}, 2000)