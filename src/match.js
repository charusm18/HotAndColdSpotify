const { MongoClient } = require('mongodb');

async function main() {
  const mongoUri = "Mongo URL Here";
  const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  const collection = client.db("UserData").collection("Users");

  try {
    await client.connect();

    // do stuff here
    // collection.insertOne()

  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

main().catch(console.error);

/**
 * getMatches() returns the array of 2 arrays 
 * [[hotMatch, percentMatch], [coldMatch, percentMatch]]
 * @param {*} userDict formatted as output of createDatabaseDict()
 */
function getMatches(userDict) {
  let maxSimilarity = -1;
  let minSimilarity = 21;
  let hotMatch = {};
  let coldMatch = {};

  const users = collection.find({}).toArray();

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const similarity = getMatchScore(userDict.genres, user.genres);

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      hotMatch = user;
    }
    if (similarity < minSimilarity) {
      minSimilarity = similarity;
      coldMatch = user;
    }
  }

  // max similarity score is 20 for n = 10
  return [[hotMatch, maxSimilarity / 20.0], [coldMatch, minSimilarity / 20.0]];
}

/**
 * getMatchScore() is a basic algorithm to find how similar two lists of
 * genres are. O(n^2) but this is fast if we assume n = 10 
 * @param {Array} array1 of topGenres in createDatabaseDict()
 * @param {Array} array2 of topGenres in createDatabaseDict()
 */
function getMatchScore(array1, array2) {
  let score = 0;

  for (let i = 0; i < array1.length; i++) {
    const indexOfGenre = array2.indexOf(array1[i]);
    if (indexOfGenre === i) {
      score += 2;
    } else if (indexOfGenre >= 0) {
      score += 1;
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
    user: userInfo,
    genres: topGenres,
    songs: topSongs,
    artists: topArtists
  };
}
