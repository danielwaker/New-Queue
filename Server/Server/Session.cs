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
        public OrderedDictionary users { get; set; }
        public List<Song> songs { get; set; }

        public Session() { }

        public Session(string sessionID, string qr, string user)
        {
            users = new OrderedDictionary();
            songs = new List<Song>();
            this.sessionID = sessionID;
            this.qr = qr;
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
            var newSong = songs.FindLast((Song song) => song.Uri == null && song.User == user);
            int userIndex = 0;
            foreach (string u in users.Keys)
            {
                if (u == user)
                {
                    break;
                }
                userIndex++;
            }
            newSong.Uri = song;
            Song userSong = new Song()
            {
                User = user,
                Uri = null
            };
            User userInfo = users[user] as User;
            int songCount = userInfo.Songs;
            int songIndex = (songCount + 1) * users.Count + userIndex;
            if (songIndex > songs.Count)
                songIndex = songs.Count;
            songs.Insert(songIndex, userSong);
            userInfo.Songs = songCount + 1;
            users[user] = userInfo;
        }

        public void RemoveSong(int songIndex)
        {
/*            foreach (Song song in songs)
            {
                if (song.Uri == null)
                {
                    songIndex++;
                }
                else
                {
                    break;
                }
            }*/
            songs.RemoveAt(songIndex);
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
