using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Server
{
    public class Session
    {
        public string sessionID { get; set; }
        public string leader { get; set; }
        public List<string> users { get; set; }
        public List<string> songs { get; set; }

        public Session(string sessionID, string user)
        {
            users = new List<string>();
            songs = new List<string>();
            this.sessionID = sessionID;
            leader = user;
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
