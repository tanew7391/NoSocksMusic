// server.js
const express = require('express');
const path = require("path");
const app = express();
const SpotifyWebApi = require('spotify-web-api-node');
const port = process.env.PORT || "8000";


// init Spotify API wrapper
var redirectUri = `http://localhost:${port}/callback`;
var tokenExpirationEpoch;
var spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: redirectUri
});


app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (req, res) => {
    res.render("main-page", { title: "Spotify Info" });
});

app.get("/authorize", (req, res) => {
    var scopesArray = req.query.scopes.split(',');
    var authorizeURL = spotifyApi.createAuthorizeURL(scopesArray);
    console.log(authorizeURL)
    res.send(authorizeURL);
});

// Exchange Authorization Code for an Access Token
app.get("/callback", (req, res) => {
    var authorizationCode = req.query.code;
    // Check folks haven't just gone direct to the callback URL
    if (!authorizationCode) {
        res.redirect('/');
    } else {
        res.render("callback", { title: "Callback" });
    }

    spotifyApi.authorizationCodeGrant(authorizationCode).then((data) => {

        // Set the access token and refresh token
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);

        // Save the amount of seconds until the access token expired
        tokenExpirationEpoch = (new Date().getTime() / 1000) + data.body['expires_in'];
        console.log('Retrieved token. It expires in ' + Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) + ' seconds!');
    }, function (err) {
        console.log('Something went wrong when retrieving the access token!', err.message);
    });
});

// listen for requests :)
app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});

