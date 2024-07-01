const MESSAGE_CODE = {
    //Auth 1000
    CREATE_USER_SUCCESS: 1001,
    CREATE_USER_FAIL: 1002,
    USER_NOT_REGISTERED: 1003,
    LOGIN_SUCCESS: 1004,
    LOGIN_FAIL: 1005,
    LOGIN_GOOGLE_SUCCESS: 1006,
    LOGIN_GOOGLE_FAIL: 1007,
    REFRESH_TOKEN_SUCCESS: 1008,

    //Message 2000
    SEND_MESSAGE_SUCCESS: 2001,
    SEND_MESSAGE_FAIL: 2002,
    NO_PERMISSION_RECALL_MESSAGE: 2003,
    //Conversation 3000

    //Friend 4000
    FRIEND_REQUEST_SENT_SUCCESS: 4001,
    FRIEND_REQUEST_SENT_FAIL: 4002,
    ACCEPT_FRIEND_SUCCESS: 4003,
    ACCEPT_FRIEND_FAIL: 4004,
    REJECT_FRIEND_SUCCESS: 4005,
    REJECT_FRIEND_FAIL: 4006,
    ALREADY_FRIEND: 4007,
    DELETE_FRIEND_SUCCESS: 4008,
    NO_PERMISSION_ACCEPT_REQUEST: 4009,
    NO_PERMISSION_REJECT_REQUEST: 4010,
    NO_PERMISSION_REMOVE_REQUEST: 4011,
    REMOVE_FRIEND_REQUEST_SUCCESS: 4012,
    REMOVE_FRIEND_SUCCESS: 4013,

    //User 5000
    CREATE_USER_SUCCESS: 5001,
    UPDATE_USER_SUCCESS: 5002,
    DELETE_USER_SUCCESS: 5003,
};

module.exports = MESSAGE_CODE;
