const mongodb = require('mongodb');
const Conversation = require('../model/conversation.model');
const Message = require('@/model/message.model');
const User = require('@/model/user.model');
const Emoji = require('@/model/emoji.model');
const MESSAGE_CODE = require('@/enums/response/messageCode.enum');
const { createResponse } = require('@/utils/responseHelper');
const STATUS_MESSAGE = require('@/enums/response/statusMessage.enum');
const { STATUS_CODE } = require('@/enums/response');
module.exports = {
    getAllMessages: async (req, res, next) => {
        try {
            const userId = req.user._id;
            const conversation_id = req.params.id;

            const conversation = await Conversation.findById(conversation_id);

            if (!conversation) {
                return res
                    .status(STATUS_CODE.NOT_FOUND)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.GROUP_NOT_FOUND,
                            MESSAGE_CODE.GROUP_NOT_FOUND,
                            STATUS_CODE.NOT_FOUND,
                            false,
                        ),
                    );
            }

            const isExistMember = conversation.users.some((item) => item.equals(userId));
            if (!isExistMember) {
                return res
                    .status(STATUS_CODE.NOT_FOUND)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.MEMBER_NOT_FOUND,
                            MESSAGE_CODE.MEMBER_NOT_FOUND,
                            STATUS_CODE.FORBIDDEN,
                            false,
                        ),
                    );
            }

            const message = await Message.find({
                conversation: conversation_id,
                status: 'active',
                deleteBy: { $nin: userId },
            })
                .populate('sender', '_id fullName picture')
                .populate('conversation')
                .populate({
                    path: 'emojiBy',
                    populate: {
                        path: 'sender',
                        select: 'fullName _id status',
                    },
                });
            if (!message) {
                return res.status(200).json({
                    message: 'Get message was successfully',
                    messageCode: 'get_message_successfully',
                    data: [],
                });
            }
            return res.status(200).json({
                message: 'Get message was successfully',
                messageCode: 'get_message_successfully',
                data: message,
            });
        } catch (error) {
            next(error);
        }
    },
    getAllMessagePagination: async (req, res, next) => {
        if (res?.paginatedResults) {
            const { results, next, previous, currentPage, totalDocs, totalPages, lastPage } = res.paginatedResults;
            const responseObject = {
                totalDocs: totalDocs || 0,
                totalPages: totalPages || 0,
                lastPage: lastPage || 0,
                count: results?.length || 0,
                currentPage: currentPage || 0,
            };

            if (next) {
                responseObject.nextPage = next;
            }
            if (previous) {
                responseObject.prevPage = previous;
            }

            responseObject.Messages = results?.map((Messages) => {
                const { user, ...otherMessageInfo } = Messages._doc;
                return {
                    ...otherMessageInfo,
                    request: {
                        type: 'Get',
                        description: '',
                    },
                };
            });

            return res.status(200).send({
                success: true,
                error: false,
                message: 'Successful found message',
                status: 200,
                data: responseObject,
            });
        }
    },
    searchMessages: async (req, res, next) => {
        if (res?.paginatedResults) {
            const { results, totalDocs, totalPages } = res.paginatedResults;
            const responseObject = {
                totalDocs: totalDocs || 0,
                totalPages: totalPages || 0,
                count: results?.length || 0,
            };

            responseObject.Messages = results?.map((Messages) => {
                const { user, ...otherMessageInfo } = Messages._doc;
                return {
                    ...otherMessageInfo,
                    request: {
                        type: 'Get',
                        description: '',
                    },
                };
            });

            return res.status(200).send({
                success: true,
                error: false,
                message: 'Successful found message',
                status: 200,
                data: responseObject,
            });
        }
    },
    sendMessage: async (data, socket) => {
        const userId = socket.user._id;
        const { message, messageType, isSpoiled, styles, emojiBy, conversationId } = data;

        var messageCreated = {
            sender: userId,
            message: message,
            conversation: conversationId,
            isSpoiled: isSpoiled,
            status: 'active',
            messageType: messageType,
            styles: styles,
            emojiBy: emojiBy,
        };
        try {
            const conversation = await Conversation.findOne({ _id: conversationId });
            if (!conversation) {
                return socket.emit(
                    'response',
                    createResponse(
                        null,
                        STATUS_MESSAGE.CONVERSATION_NOT_FOUND,
                        MESSAGE_CODE.CONVERSATION_NOT_FOUND,
                        false,
                    ),
                );
            }

            const isUserAlreadyExist = conversation.users.find((item) => item.equals(userId));
            if (!isUserAlreadyExist) {
                return res
                    .status(STATUS_CODE.FORBIDDEN)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.USER_NOT_IN_GROUP,
                            MESSAGE_CODE.USER_NOT_IN_GROUP,
                            STATUS_CODE.FORBIDDEN,
                            false,
                        ),
                    );
            }

            const isUserBlocked = conversation.blockUsers.some((item) => item.equals(userId));
            if (isUserBlocked) {
                return res
                    .status(STATUS_CODE.FORBIDDEN)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.USER_WAS_BLOCKED,
                            MESSAGE_CODE.USER_WAS_BLOCKED,
                            STATUS_CODE.FORBIDDEN,
                            false,
                        ),
                    );
            }

            var newMessage = await Message.create(messageCreated);
            newMessage = await newMessage.populate('sender', 'fullName picture email');
            newMessage = await newMessage.populate('conversation');
            newMessage = await User.populate(newMessage, {
                path: 'conversation.users',
                select: 'fullName picture email',
            });
            await Conversation.findByIdAndUpdate(
                conversationId,
                {
                    latestMessage: newMessage._id,
                },
                { new: true },
            );

            return res
                .status(201)
                .json(
                    createResponse(
                        newMessage,
                        STATUS_MESSAGE.SEND_MESSAGE_SUCCESS,
                        MESSAGE_CODE.SEND_MESSAGE_SUCCESS,
                        STATUS_CODE.CREATED,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    deleteMessage: async (req, res, next) => {
        const messageId = req.query.id;
        const userId = req.user._id;
        try {
            const messageUpdate = await Message.findByIdAndUpdate(
                messageId,
                { $push: { deleteBy: userId } },
                { new: true, useFindAndModify: false },
            );
            return res
                .status(200)
                .json(
                    createResponse(
                        messageUpdate,
                        STATUS_MESSAGE.DELETE_MESSAGE_SUCCESS,
                        MESSAGE_CODE.DELETE_MESSAGE_SUCCESS,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    editMessage: async (req, res, next) => {
        const messageId = req.query.id;
        const userId = req.user._id;
        const { content } = req.body;
        const message = Message.findOne(messageId);
        if (!message) {
            return res.status(404).json({
                message: STATUS_MESSAGE.MESSAGE_NOT_FOUND,
                messageCode: 'message_not_found',
                status: MESSAGE_CODE.MESSAGE_NOT_FOUND,
            });
        }
        try {
            if (String(message.sender) !== String(userId)) {
                return res.status(400).json({
                    message: STATUS_MESSAGE.NO_PERMISSION_EDIT_MESSAGE,
                    messageCode: 'no_permission_edit_message',
                    status: MESSAGE_CODE.NO_PERMISSION_RECALL_MESSAGE,
                    success: false,
                });
            }
            const createdAt = message.createdAt;
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            if (createdAt < thirtyMinutesAgo) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.MESSAGE_TOO_OLD_TO_EDIT,
                            MESSAGE_CODE.MESSAGE_TOO_OLD_TO_EDIT,
                            STATUS_CODE.OK,
                            false,
                        ),
                    );
            }
            const messageUpdated = Message.findByIdAndUpdate(messageId, { message: content });
            return res
                .status(200)
                .json(
                    createResponse(
                        messageUpdated,
                        STATUS_MESSAGE.EDIT_MESSAGE_SUCCESS,
                        MESSAGE_CODE.EDIT_MESSAGE_SUCCESS,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    recallMessage: async (req, res, next) => {
        const messageId = req.query.id;
        console.log('messageId: ', messageId);
        const userId = req.user._id;
        try {
            const message = await Message.findOne({ _id: messageId });
            if (String(message.sender) !== String(userId)) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            message,
                            STATUS_MESSAGE.NO_PERMISSION_RECALL_MESSAGE,
                            MESSAGE_CODE.NO_PERMISSION_RECALL_MESSAGE,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }
            const messageUpdate = await Message.findByIdAndUpdate({ _id: messageId }, { status: 'recalled' });
            return res
                .status(200)
                .json(
                    createResponse(
                        messageUpdate,
                        STATUS_MESSAGE.RECALL_MESSAGE_SUCCESS,
                        MESSAGE_CODE.RECALL_MESSAGE_SUCCESS,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    addEmojiMessage: async (req, res, next) => {
        const { emoji } = req.body;
        const messageId = req.query.id;
        const userId = req.user._id;
        if (!mongodb.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                message: 'The id is invalid',
                messageCode: 'invalid_id',
            });
        }
        try {
            const addEmoji = await Emoji.create({
                sender: userId,
                emoji: emoji,
                status: 'active',
            });
            const addEmojiMessage = await Message.findByIdAndUpdate(
                messageId,
                {
                    $push: { emojiBy: addEmoji._id },
                },
                { new: true, useFindAndModify: false },
            ).populate({
                path: 'emojiBy',
                populate: {
                    path: 'sender',
                    select: 'fullName _id',
                },
            });
            return res.status(201).json({
                message: STATUS_MESSAGE.ADD_EMOJI_MESSAGE_SUCCESS,
                data: addEmojiMessage,
                conversation: addEmojiMessage.conversation,
                action: 'add',
                success: true,
            });
        } catch (error) {
            return next(error);
        }
    },
    updateEmojiMessage: async (req, res, next) => {
        const { newEmoji } = req.body;
        const { id } = req.query;
        const userId = req.user._id;
        if (!mongodb.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'The id is invalid',
                messageCode: 'invalid_id',
            });
        }
        try {
            const emoji = await Emoji.findOne({ _id: id });
            console.log('emoji: ', emoji);
            if (!emoji) {
                return res.status(200).json({
                    message: 'Emoji has been remove',
                    status: 200,
                });
            }
            if (String(userId) !== String(emoji.sender)) {
                return res.status(409).json({
                    message: STATUS_MESSAGE.NOT_YOUR_EMOJI,
                    status: MESSAGE_CODE.NOT_YOUR_EMOJI,
                    success: false,
                });
            }
            const updateEmoji = await Emoji.findByIdAndUpdate(
                { _id: id },
                {
                    emoji: newEmoji,
                },
                { new: true, useFindAndModify: false },
            );
            return res.status(200).json({
                message: STATUS_MESSAGE.UPDATE_EMOJI_MESSAGE_SUCCESS,
                data: updateEmoji,
                action: 'edit',
                success: true,
            });
        } catch (error) {
            return next(error);
        }
    },
    removeEmojiMessage: async (req, res, next) => {
        const { emoji } = req.body;
        const { emojiId, messageId } = req.query;
        const userId = req.user._id;
        if (!mongodb.ObjectId.isValid(emojiId)) {
            return res.status(400).json({
                message: 'The id is invalid',
                messageCode: 'invalid_id',
            });
        }
        try {
            const emoji = await Emoji.findOne({ _id: emojiId });
            if (!emoji) {
                return res.status(400).json({
                    message: 'Emoji has been remove',
                    status: STATUS_CODE.BAD_REQUEST,
                    success: false,
                });
            }
            if (String(userId) !== String(emoji.sender)) {
                return res.status(409).json({
                    message: STATUS_MESSAGE.NOT_YOUR_EMOJI,
                    status: MESSAGE_CODE.NOT_YOUR_EMOJI,
                });
            }
            const updateMessage = await Message.findByIdAndUpdate(
                messageId,
                {
                    $pull: { emojiBy: emoji._id },
                },
                { new: true, useFindAndModify: false },
            );
            const updateEmoji = await Emoji.findOneAndDelete({ _id: emojiId });
            return res.status(200).json({
                message: STATUS_MESSAGE.REMOVE_EMOJI_MESSAGE_SUCCESS,
                data: updateEmoji,
                conversation: updateMessage.conversation,
                action: 'delete',
                success: true,
            });
        } catch (error) {
            return next(error);
        }
    },
    // sendMessage: async (req, res, next) => {
    //   try {
    //     const conversation_id = req.params.id;
    //     if (!mongodb.ObjectId.isValid(conversation_id)) {
    //       return res.status(400).json({
    //         message: 'The conversation id is invalid',
    //         messageCode: 'invalid_conversation_id',
    //       });
    //     }
    //     const senderId = req.user._id ;
    //     const { message } = req.body;
    //     // let conversation = await Conversation.findOne({
    //     //   id: conversation_id,
    //     // });
    //     // if (!conversation) {
    //     //   conversation = new Conversation({
    //     //     participants: [senderId, receiverId],
    //     //   });
    //     // }
    //     // const newMessage = await Message.create({
    //     //   senderId,
    //     //   receiverId,
    //     //   message,
    //     // });
    //     // if (newMessage) {
    //     //   conversation.messages.push(newMessage._id);
    //     // }
    //     // await conversation.save();
    //     return res.status(201).json({
    //       message: 'Message sent successfully',
    //       messageCode: 'sent_successfully',
    //       data: message,
    //     });
    //   } catch (error) {
    //     next(error);
    //   }
    // },
};