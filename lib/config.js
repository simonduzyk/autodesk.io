
exports.autodeskConfig = {
    client_id: "aWL6N7AiWRJnIfHMu3kaCjd5Yvf8AhL3",
    client_secret: "ojonbxTQksoS5IuR",
    oauth_callback: "http://autodesk-io.herokuapp.com/oauthcallback",
    authorize_url: "https://developer.api.autodesk.com/authentication/v1/authorize?",
    get_token_url: 'https://developer.api.autodesk.com/authentication/v1/gettoken',
    get_user_url: 'https://developer.api.autodesk.com/userprofile/v1/users/@me'
};

exports.dev = true;// process.env.NODE_LOCAL || false;
console.log('Server dev mode: ' + exports.dev);