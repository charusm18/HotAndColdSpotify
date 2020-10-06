const match = require('./match');

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const { json, Router } = require('express');

var propertiesReader = require('properties-reader');
var properties = propertiesReader('deploy.txt');

var client_id = ''; // Your client id
var client_secret = ''; // Your secret
var redirect_uri = 'https://charusm18.github.io/HotAndColdSpotify/docs/public/callback'; // Your redirect uri

var user_info = {}; //dictionary that holds user information
var artist_list = []; //list of dictionaries that holds a list of a user's top artists and info about that artists
var genre_list = []; //list of your top genres
var songs_list = []; //list of your top songs


/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();


app.use(express.static(__dirname + '/public'))
  .use(cors())
  .use(cookieParser());

/**
 * GET request of login through spotify and get user authentication
 */
app.get('/login', function (req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});


/**
 * GET request for the callback function to use the Spotify Web APIs and 
 * get user data from Spotify libraries (User Information, Personalization
 * Artist, Personalization Tracks)
 */
app.get('/callback', function (req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function (error, response, body) {

      //if we have a valid authentication code, get data
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
          refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        var artists = {
          url: 'https://api.spotify.com/v1/me/top/artists',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        var tracks = {
          url: 'https://api.spotify.com/v1/me/top/tracks',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        //populates the user_info with relavent information from JSON
        request.get(options, function (error, response, body) {
          user_info["displayName"] = body["display_name"];
          
          if(body["images"][0] == undefined)
            user_info["profilePic"] = "images/no_profile.png";
          else
            user_info["profilePic"] = body["images"][0]["url"];


          user_info["userUrl"] = body["external_urls"]["spotify"];
        });

        //populates the genre_list and artist_list with relavent information from JSON
        request.get(artists, function (error, response, body) {
          var i;
          for (i = 0; i < body["items"].length; i++) {
            var dict = {};
            dict["artistName"] = body["items"][i]["name"];
            dict["artistPic"] = body["items"][i]["images"][0]["url"];
            dict["artistUrl"] = body["items"][i]["external_urls"]["spotify"];

            artist_list[i] = dict;

            var j = 0;
            artist_genres = body["items"][i]["genres"];
            while (genre_list.includes(artist_genres[j]) && j < artist_genres.length) {
              j++;
            }
            if (artist_genres[j] != undefined) // incase all the genres of at artist has been seen before
              genre_list.push(artist_genres[j]);
          }

        });

        //populates the song_list with relavent information from JSON
        request.get(tracks, async function (error, response, body) {
          var i;
          for (i = 0; i < body["items"].length; i++) {
            var dict = {};
            dict["songName"] = body["items"][i]["name"];
            dict["songPicture"] = body["items"][i]["album"]["images"][0]["url"];
            dict["songUrl"] = body["items"][i]["external_urls"]["spotify"];

            var artists = [];
            var j;
            for (j = 0; j < body["items"][i]["artists"].length; j++) {
              artists.push(body["items"][i]["artists"][j]["name"])
            }

            dict["songArtists"] = artists;
            songs_list.push(dict);
          }

        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});


/**
 * GET request for the request token, not really used in this application
 */
app.get('/refresh_token', function (req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });

});

/**
 * POST request to get the Dictionary matches and send to frontEnd; takes no 
 * inputs since everything needed is stored in global variables
 */
app.post('/dictionary-matches', async function (req, res) {

  //creates a dictionary with user's data
  userDict = match.createDatabaseDict(user_info, genre_list, songs_list, artist_list);

  //creates a dictionary with the user's hot matches, cold matches, and percentages
  matchDict = await match.getMatches(userDict);

  //creates a dictionary that includes the data, and sucess variable to indicate sucess
  input = { data: matchDict, user: userDict, success: true };

  res.send(input); //sends input to url

});

app.listen(8888);

