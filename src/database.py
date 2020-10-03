from pymongo import MongoClient # pip3 install pymongo dnspython

client = MongoClient('MongoDB URL Here')
db = client.UserData
usersCollection = db.Users

result = usersCollection.insert_one({"display_name" : "Margaret", "top_artists" : ["Lorde", "Taylor Swift"]})
print(result.inserted_id)