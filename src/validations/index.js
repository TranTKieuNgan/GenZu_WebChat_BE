const Joi = require('joi');

const authValidator = require('./auth.validation');
const groupValidator = require('./group_chat.validation');
const messageValidator = require('./message.validation');
const userValidator = require('./user.validation');
const { objectIdValidator } = require('@/utils/functions');

const validateIdMongodb = Joi.object({
    id: Joi.string().required().custom(objectIdValidator, 'ObjectId validation'),
});

module.exports = {
    validateIdMongodb,
    ...authValidator,
    ...groupValidator,
    ...messageValidator,
    ...userValidator,
};