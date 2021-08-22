using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Threading.Tasks;

namespace Server
{
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
            users.Add(user, 0);
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
            var yeah = ((System.Text.Json.JsonElement)users[user]).TryGetInt32(out int songCount);
            if (yeah)
            {
                var songIndex = (songCount + 1) * users.Count + userIndex;
                if (songIndex > songs.Count)
                    songIndex = songs.Count;
                songs.Insert(songIndex, userSong);
                users[user] = songCount + 1;
            }
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
    }
}
