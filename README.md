# autodesk.io

Type
npm install
bower install
in root directory

Heroku
Creating autodesk-io... done
http://autodesk-io.herokuapp.com/ | https://git.heroku.com/autodesk-io.git

Autodesk Assets
https://dam.autodesk.com/dam/dashboard

Assets description: assets\assets.json

TESTING ON LOCAL HOST
1. Change temporary 8080 to 80 in server.js: app.set('port', (process.env.PORT || 80));
2. Add as administrator to c:\Windows\System32\drivers\etc\hosts : 127.0.0.1 autodesk-io.herokuapp.com