from pymongo import MongoClient # pip3 install pymongo dnspython

client = MongoClient('Mongo URL Here')
users_collection = client.UserData.Users

# result = users_collection.insert_one(get_database_dict())
# print(result.inserted_id)

"""
get_matches() returns the pair of pairs 
((hot_match, percent_match), (cold_match, percent_match)) 

userDict - dict in the form outputted by get_database_dict()
"""
def get_matches(self, userDict):
  max_similarity = -1
  min_similarity = 21
  hot_match = {}
  cold_match = {}
  for user in users_collection.find():
    similarity = get_match_score(self, userDict.get("top_genres"), user.get("top_genres"))
    if similarity > max_similarity:
      max_similarity = similarity
      hot_match = user
    if similarity < min_similarity:
      min_similarity = similarity
      cold_match = user
  return ((hot_match, max_similarity / 20.), (cold_match, min_similarity / 20.)) # max similarity score is 20 for n = 10

"""
get_match_score() is a basic algorithm to find how similar two lists of
genres are. O(n^2) but this is fast if we assume n = 10 
"""
def get_match_score(self, list1, list2):
  score = 0
  for i in range(list1):
    genre = list1[i]
    try: 
      genre_match = list2.index(genre)
      if genre_match == i:
        score += 2
      else:
        score += 1
    except ValueError as e:
      pass
  return score

"""
get_database_dict() returns the dict that should be inserted into the 
mongoDB collection. 

display_name - string
account_id - string
top_genres - list of strings, length 10
top_songs - list of (song_name, artist) pairs, length 10
top_artists - list of strings, length 10
"""
def get_database_dict(self, display_name, account_id, top_genres, top_songs, top_artists):
  return {
    "display_name" : display_name,
    "account_id" : account_id,
    "top_genres" : top_genres,
    "top_songs" : top_songs,
    "top_artists" : top_artists
  }