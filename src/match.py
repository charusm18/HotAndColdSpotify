from pymongo import MongoClient # pip3 install pymongo dnspython

client = MongoClient('mongodb+srv://admin:KX1U1uNS41ECEnzy@hotandcold.dzr2r.mongodb.net/UserData?retryWrites=true&w=majority')
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

user_info - tuple of (display_name, user_url, user_pic)
top_genres - list of strings, length 10
top_songs - list of (song_name, artist, album_cover, song_url) pairs, length 10
top_artists - list of (artist_name, pic_url), length 10
"""
def get_database_dict(self, user_info, top_genres, top_songs, top_artists):
  return {
    "user_info" : user_info,
    "top_genres" : top_genres,
    "top_songs" : top_songs,
    "top_artists" : top_artists
  }