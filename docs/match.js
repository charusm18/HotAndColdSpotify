/**
 * getMatches() returns the dictionary
 * {hotMatch, hotPercentMatch, coldMatch, coldPercentMatch}
 * @param {dict} userDict formatted as output of createDatabaseDict()
 */
async function getMatches(userDict) {
  const { MongoClient } = require('mongodb');
  const mongoUri = "";
  const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const collection = client.db("UserData").collection("Users");

    // there should only ever be one dict representing each user
    const result = await collection.find({ "user.userUrl": userDict["user"]["userUrl"] }).toArray();
    if (result.length !== 0) {
      collection.deleteOne(result[0]);
    }

    let maxSimilarity = -1;
    let minSimilarity = 21;
    let hotMatch = {};
    let coldMatch = {};

    const users = await collection.find({}).toArray();

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
    await collection.insertOne(userDict);

    await client.close();

    // max similarity score is 20 for n = 10
    return {
      "hotMatch": hotMatch,
      "hotPercentMatch": Math.round(1000.0 * maxSimilarity / 20.0) / 10.0,
      "coldMatch": coldMatch,
      "coldPercentMatch": Math.round(1000.0 * minSimilarity / 20.0) / 10.0
    };

  } catch (e) {
    console.error(e);
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
      score += (array1.length - Math.abs(indexOfGenre - i)) / parseFloat(array1.length);
    }
  }

  return score;
}

/**
 * createDatabaseDict() returns the dict that should be inserted into the 
 * mongoDB collection for storage and future matching
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

// export functions so they can be called in app.js
module.exports = { createDatabaseDict, getMatches }