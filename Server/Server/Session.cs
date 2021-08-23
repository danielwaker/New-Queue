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
        public int songs { get; set; }
        public string color { get; set; }
    }

    public class Song
    {
        public string user { get; set; }
        public string uri { get; set; }
    }

    public class Session
    {
        public string sessionID { get; set; }
        public string leader { get; set; }
        public OrderedDictionary users { get; set; }
        public List<Song> songs { get; set; }

        public Session() { }

        public Session(string sessionID, string user)
        {
            users = new OrderedDictionary();
            songs = new List<Song>();
            this.sessionID = sessionID;
            leader = user;
            AddUser(user);
        }

        public void AddUser(string user)
        {
            string color = RandomColor();
            User userInfo = new User()
            {
                color = color,
                songs = 0
            };
            users.Add(user, userInfo);
            Song userSong = new Song()
            {
                user = user,
                uri = null
            };
            songs.Insert(users.Count - 1, userSong);
        }

        public void RemoveUser(string user)
        {
            users.Remove(user);
        }

        public void AddSong(string user, string song)
        {
            var newSong = songs.FindLast((Song song) => song.uri == null && song.user == user);
            int userIndex = 0;
            foreach (string u in users.Keys)
            {
                if (u == user)
                {
                    break;
                }
                userIndex++;
            }
            newSong.uri = song;
            Song userSong = new Song()
            {
                user = user,
                uri = null
            };
            User userInfo = StupidDeserialization((JsonElement)users[user]);
            int songCount = userInfo.songs;
            int songIndex = (songCount + 1) * users.Count + userIndex;
            if (songIndex > songs.Count)
                songIndex = songs.Count;
            songs.Insert(songIndex, userSong);
            userInfo.songs = songCount + 1;
            users[user] = userInfo;
        }

        public void RemoveSong(string user, string song)
        {
            Song userSong = new Song()
            {
                user = user,
                uri = song
            };
            songs.Remove(userSong);
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
