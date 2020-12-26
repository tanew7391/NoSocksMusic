// server.js
const express = require('express');
const path = require("path");
const app = express();
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
dotenv.config();
const port = process.env.PORT || "8000";
const scopeList = ["user-library-read"]
var isAutho = false;


// init Spotify API wrapper
var redirectUri = `http://localhost:${port}/callback`;
var tokenExpirationEpoch;
var spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: redirectUri
});
var tokenExpirationEpoch;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));



app.get("/", (req, res) => {
    if (!isAutho) {
        res.render("authorize", { title: "Authorize" });
    } else if (tokenExpirationEpoch < (new Date().getTime() / 1000)) {
        spotifyApi.refreshAccessToken().then(spotifyApi.refreshAccessToken().then(
            function (data) {
                console.log('The access token has been refreshed!');
                // Save the access token so that it's used in future calls
                spotifyApi.setAccessToken(data.body['access_token']);
                res.redirect('/');
            },
            function (err) {
                console.log('Could not refresh access token', err);
                res.redirect('/');
            }
        ));
    } else {
        res.render("main-page");
    }
});

app.get('/userTracks', (req, res) => {
    if (!isAutho) {
        res.redirect('/');
        return;
    }
    var trackToAlbumDict = {};

    spotifyApi.getMySavedTracks({
        limit: 50,
        offset: 0
    })
        .then(function (data) {
            for (const item of data.body.items) {
                console.log(item.track.name);
                console.log(item.track.album.id);
                trackToAlbumDict[item.track.name] = item.track.album.id;
            }
        },
            function (err) {
                console.log('Something went wrong!', err);
                res.redirect('/');
            }).then(    console.log(trackToAlbumDict)          );
            /*
    for (var track in trackToAlbumDict) {
        spotifyApi.getAlbums(trackToAlbumDict[track]).then(
            function (data) {
                console.log(data.body);
            },
            function (err) {
                console.log('Something went wrong!', err);
                res.redirect('/');
            });
            
    }
    */
    res.render('main-page');
})

app.get("/authorize", (req, res) => {
    var authorizeURL = spotifyApi.createAuthorizeURL(scopeList);
    console.log(scopeList)
    console.log(authorizeURL)
    res.redirect(authorizeURL);
});

app.get('/hey', (req, res) => res.send('ho!'));

// Exchange Authorization Code for an Access Token


app.get("/callback", (req, res) => {
    var authorizationCode = req.query.code;
    // Check folks haven't just gone direct to the callback URL
    if (!authorizationCode) {
        isAutho = false;
        res.redirect('/');
    } else {
        isAutho = true;
        res.render("callback", { title: "Callback" });
    }

    spotifyApi.authorizationCodeGrant(authorizationCode).then((data) => {
        // Set the access token and refresh token
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);

        // Save the amount of seconds until the access token expired
        tokenExpirationEpoch = (new Date().getTime() / 1000) + data.body['expires_in'];
        console.log('Retrieved token. It expires in ' + Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) + ' seconds!');
    }, (err) => {
        console.log('Something went wrong when retrieving the access token!', err.message);
    });
});


// listen for requests :)
app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});

