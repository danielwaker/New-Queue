using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Buffers;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Server
{
    public class User
    {
        public int Songs { get; set; }
        public string Color { get; set; }
        public bool Leader { get; set; }
    }

    public class Song
    {
        public string User { get; set; }
        public string Uri { get; set; }
    }

    public class Session
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string sessionID { get; set; }
        public string qr { get; set; }
        public DateTime createdAt { get; set; }
        public OrderedDictionary users { get; set; }
        public List<Song> songs { get; set; }

        public Session() { }

        public Session(string sessionID, string qr, string user, DateTime createdAt)
        {
            users = new OrderedDictionary();
            songs = new List<Song>();
            this.sessionID = sessionID;
            this.qr = qr;
            this.createdAt = createdAt;
            AddUser(user, true);
        }

        public void AddUser(string user, bool leader = false)
        {
            string color = RandomColor();
            User userInfo = new User()
            {
                Color = color,
                Songs = 0,
                Leader = leader
            };
            users.Add(user, userInfo);
            Song userSong = new Song()
            {
                User = user,
                Uri = null
            };
            songs.Insert(users.Count - 1, userSong);
        }

        public void RemoveUser(string user)
        {
            users.Remove(user);
            songs.RemoveAll(song => song.User == user);
        }

        public void AddSong(string user, string song)
        {
            // find last instance of free space for user song
            var newSongIndex = songs.FindLastIndex((Song song) => song.Uri == null && song.User == user);
            var newSong = songs[newSongIndex];

            // user index because apparently ordered dicts have no indexing
            int userIndex = 0;
            foreach (string u in users.Keys)
            {
                if (u == user)
                {
                    break;
                }
                userIndex++;
            }

            // sets previous free space to the new song URI
            newSong.Uri = song;

            // so this is the process for where the new free space gets added
            Song userSong = new Song()
            {
                User = user,
                Uri = null
            };
            User userInfo = users[user] as User;
            int userSongCount = userInfo.Songs;

            // TODO: what is happening here lol
            int songIndex = (userSongCount + 1) * users.Count + userIndex;
            if (songIndex > songs.Count)
                songIndex = songs.Count;
            songs.Insert(songIndex, userSong);
            userInfo.Songs = userSongCount + 1;
            users[user] = userInfo;

            return;
            // proposed alternative?
        }


        public void RemoveSong(int songIndex)
        {
            // so the index of the visual queue may not match the virtual queue
            // because of free spaces
            // so here we are setting the visual song index to be the virtual index
            int i = 0;
            foreach (Song song in songs)
            {
                // if we have reached the song index, stop
                if (i == songIndex)
                {
                    break;
                }
                // if the index has a free space, increment song index
                else if (song.Uri == null)
                {
                    songIndex++;
                }
                i++;
            }

            // decrement the number of songs the user who queued the song has
            // if the user has no more songs queued, put in a new free space
            var userKey = songs[songIndex].User;
            var user = users[userKey] as User;
            user.Songs = user.Songs - 1;
            users[userKey] = user;
            if (user.Songs == 0)
            {
                Song userSong = new Song()
                {
                    User = userKey,
                    Uri = null
                };
                songs.Insert(users.Count - 1, userSong);
            }

            songs.RemoveAt(songIndex);

            // TODO: I don't really know why this is here ?
            songs.Capacity = songs.Capacity - 1;
        }

        public void Reorder(int songIndex, int newIndex)
        {
            Song song = songs[songIndex];
            songs.RemoveAt(songIndex);
            songs.Insert(newIndex, song);
        }

        public string GetQr()
        {
            return qr;
        }

        public List<Song> GetSongs()
        {
            return songs;
        }

        public OrderedDictionary GetUsers()
        {
            return users;
        }

        private User StupidDeserialization(JsonElement element)
        {
            JsonSerializerOptions options = null;
            var bufferWriter = new ArrayBufferWriter<byte>();
            using (var writer = new Utf8JsonWriter(bufferWriter))
            {
                element.WriteTo(writer);
            }

            return JsonSerializer.Deserialize<User>(bufferWriter.WrittenSpan, options);
        }

        private string RandomColor()
        {
            return "#" + Convert.ToString((int)Math.Floor(new Random().NextDouble() * 16777215), 16);
        }
    }
}
