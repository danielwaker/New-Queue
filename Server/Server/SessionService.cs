using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Server
{
    public class SessionService
    {
        private readonly IMongoCollection<Session> _session;

        public SessionService(ISessionDatabaseSettings settings)
        {
            var client = new MongoClient(settings.ConnectionString);
            var database = client.GetDatabase(settings.DatabaseName);

            _session = database.GetCollection<Session>(settings.SessionsCollectionName);
        }

        public Session Get(string sessionId) =>
            _session.Find(session => session.sessionID == sessionId).FirstOrDefault();

        public Session Create(string sessionId, string user)
        {
            Session session = new Session(sessionId, user);
            _session.InsertOne(session);
            return session;
        }

        public void Update(string sessionId, Session sessionIn) =>
            _session.ReplaceOne(session => session.sessionID == sessionId, sessionIn);

        public void Remove(string sessionId) =>
            _session.DeleteOne(session => session.sessionID == sessionId);
    }
}
