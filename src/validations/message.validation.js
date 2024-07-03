const Joi = require('joi');
const { validateIdMongodb } = require('.');
const { objectIdValidator } = require('@/utils/functions');

const getMessages = Joi.object({
    id: Joi.string().required().custom(objectIdValidator, 'ObjectId validation'),
    limit: Joi.number(),
    search: Joi.string(),
    startDate: Joi.date(),
    endDate: Joi.date(),
});

const sendMessage = Joi.object({
    message: Joi.string().min(1).required(),
    isSpoiled: Joi.string(),
    messageType: Joi.string(),
    styles: Joi.object({
        fontSize: Joi.number(),
        bold: Joi.boolean(),
        italic: Joi.boolean(),
        underline: Joi.boolean(),
    }),
    //   sender_id: Joi.string().required(),
    //   conversation_id: Joi.string().required(),
    //   message_type: Joi.string().required(),
    //   status: Joi.string().required(),
});
const sendEmoji = Joi.object({
    emoji: Joi.string().required(),
});
const updateEmoji = Joi.object({
    newEmoji: Joi.string().required(),
});
module.exports = {
    getMessages,
    sendMessage,
    sendEmoji,
    updateEmoji,
};
