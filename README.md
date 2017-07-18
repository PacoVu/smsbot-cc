# smsbot-cc
- Build a currency converter service using RingCentral SMS framework.
- This demo project shows how to use RingCentral SMS and Push Notification APIs to implement a SMS bot. The bot will listen for incoming SMS messages then reply to the sender with relevant content.
# Setup
```
git clone https://github.com/pacovu/smsbot-cc
cd smsbot-cc
npm intall --save
```
- Rename the dotenv to .env and provide your app credentials, RingCentral sandbox account's username and password
- Replace this "YOUR_WEBSERVER_POST_HOOK_OR_NGROK_FORWARDING" with your webhook address
> If you run the app in a localhost, you can use [ngrok](https://gist.github.com/wosephjeber/aa174fb851dfe87e644e)

# RingCentral Developer Portal
To setup a RingCentral free developer account, click [here](https://developer/ringcentral.com)

# Technologies used
- [RingCentral's SMS/MMS API](https://developer.ringcentral.com/api-docs/latest/index.html#!#RefSMSMessages.html)
- [RingCentral's Push Notification API](https://developer.ringcentral.com/api-docs/latest/index.html#!#RefNotifications.html)
- [https://nodejs.org/en/](Node.js)
