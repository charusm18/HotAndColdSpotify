const { MongoClient } = require('mongodb');
const mongoUri = "Mongo URL Here";
const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
const collection = client.db("UserData").collection("Users");

/**
 * getMatches() returns the array of 2 arrays 
 * [[hotMatch, percentMatch], [coldMatch, percentMatch]]
 * @param {*} userDict formatted as output of createDatabaseDict()
 */
async function getMatches(userDict) {
  try {
    await client.connect();

    // there should only ever be one dict representing each user
    const result = collection.find({ "user": { "userUrl": userDict["user"]["userUrl"] } }).toArray(); // TODO
    if (result !== []) {
      collection.deleteOne(result[0]);
    }

    let maxSimilarity = -1;
    let minSimilarity = 21;
    let hotMatch = {};
    let coldMatch = {};

    const users = collection.find({}).toArray();

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const similarity = getMatchScore(userDict["genres"], user["genres"]);

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        hotMatch = user;
      }
      if (similarity < minSimilarity) {
        minSimilarity = similarity;
        coldMatch = user;
      }
    }

    // add new user data to DB
    collection.insertOne(userDict);

    await client.close();

    // max similarity score is 20 for n = 10
    return [[hotMatch, maxSimilarity / 20.0], [coldMatch, minSimilarity / 20.0]];

  } catch (e) {
    console.error(e);
    await client.close();
  }
}

/**
 * getMatchScore() is a basic algorithm to find how similar two lists of
 * genres are. O(n^2) but this is fast if we assume n = 10 
 * @param {Array} array1 of topGenres in createDatabaseDict()
 * @param {Array} array2 of topGenres in createDatabaseDict()
 */
function getMatchScore(array1, array2) {
  let score = 0.0;

  for (let i = 0; i < array1.length; i++) {
    const indexOfGenre = array2.indexOf(array1[i]);
    const rankMultiplier = (array1.length - i) / parseFloat(array1.length);
    if (indexOfGenre === i) {
      score += 2.0 * rankMultiplier;
    } else if (indexOfGenre >= 0) {
      score += 0.25 + Math.abs(indexOfGenre - i) / parseFloat(array1.length) * rankMultiplier;
    }
  }

  return score;
}

/**
 * The dict that should be inserted into the mongoDB collection
 * @param {dict} userInfo of {displayName, userUrl, userPic}
 * @param {Array} topGenres genre names as strings, length 10
 * @param {Array of dict} topSongs of {songName, artist, albumCover, songUrl} length 10
 * @param {Array of dict} topArtists of {artistName, picUrl} length 10
 */
function createDatabaseDict(userInfo, topGenres, topSongs, topArtists) {
  return {
    "user": userInfo,
    "genres": topGenres,
    "songs": topSongs,
    "artists": topArtists
  };
}

module.exports = {createDatabaseDict, getMatches}