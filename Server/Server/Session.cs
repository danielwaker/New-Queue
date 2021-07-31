using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Server
{
    public class Session
    {
        public string sessionID;
        public List<string> users;
        public List<string> songs;

        public Session(string sessionID, string user)
        {
            users = new List<string>();
            songs = new List<string>();
            this.sessionID = sessionID;
            users.Add(user);
        }

        public void AddUser(string user)
        {
            users.Add(user);
        }

        public void RemoveUser(string user)
        {
            users.Remove(user);
        }

        public void AddSong(string song)
        {
            songs.Add(song);
        }

        public void RemoveSong(string song)
        {
            songs.Remove(song);
        }
    }
}
