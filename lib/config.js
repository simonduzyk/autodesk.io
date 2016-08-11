
exports.autodeskConfig = {
    client_id: "uqujl3B8vBCfAQIQKexT3laMFNO8rLt0",
    client_secret: "SyicH4cX1tjJkByM",
    oauth_callback: "http://adsk-io.herokuapp.com/oauthcallback",
    authorize_url: "https://developer.api.autodesk.com/authentication/v1/authorize?",
    get_token_url: 'https://developer.api.autodesk.com/authentication/v1/gettoken',
    get_user_url: 'https://developer.api.autodesk.com/userprofile/v1/users/@me'
};

exports.dev = false;// process.env.NODE_LOCAL || false;
console.log('Server dev mode: ' + exports.dev);