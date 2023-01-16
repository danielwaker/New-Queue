using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using QRCoder;
using SpotifyAPI.Web;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class QueueController : ControllerBase
    {
        private readonly ILogger<QueueController> _logger;
        private readonly IHubContext<BroadcastHub, IHubClient> _hubContext;
        private readonly IConfiguration _iConfig;
        private readonly SessionService _sessionService;
        private static Dictionary<string, object> sessionLocks = new Dictionary<string, object>();

        public QueueController(SessionService sessionService, IHubContext<BroadcastHub, IHubClient> hubContext, IConfiguration iConfig, ILogger<QueueController> logger)
        {
            _sessionService = sessionService;
            _hubContext = hubContext;
            _iConfig = iConfig;
            _logger = logger;
        }

        [HttpGet("CreateSession")]
        public object CreateSession(string user, string connectionID)
        {
            string sessionID = SessionID();
            //string url = $"{Request.Scheme}://{Request.Host}{Request.PathBase}?sessionID={sessionID}";
            string url = _iConfig.GetValue<string>("URL") + $"login?sessionID={sessionID}";
            string sessionQR = SessionQR(url);
            CreateSessionData(sessionID, sessionQR, user);
            _hubContext.Groups.AddToGroupAsync(connectionID, sessionID);
            return new
            {
                sessionID = sessionID,
                sessionQR = sessionQR
            };
        }

        [HttpPost("EndSession")]
        public async Task<IActionResult> EndSession(string sessionID)
        {
            _sessionService.Remove(sessionID);
            await _hubContext.Clients.Group(sessionID).BroadcastEnd();
            return NoContent();
        }

        [HttpPost("LeaveSession")]
        public async Task<IActionResult> LeaveSession(string sessionID, string user, string connectionId)
        {
            Session session = _sessionService.Get(sessionID);
            
            //if leader ends session
            if (session != null)
            {
                session.RemoveUser(user);
                _sessionService.Update(sessionID, session);
                await _hubContext.Groups.RemoveFromGroupAsync(connectionId, sessionID);
                await _hubContext.Clients.Group(sessionID).BroadcastUsers();
            }
            return NoContent();
        }

        /// <summary>
        /// Creates a session ID in the form of a 6 digit number.
        /// </summary>
        /// <returns>A string with a session ID.</returns>
        private string SessionID()
        {
            int session = new Random().Next(0, 999999);
            string fmt = "000000";
            return session.ToString(fmt);
        }

        private string SessionQR(string url)
        {
            QRCodeGenerator qrGenerator = new QRCodeGenerator();
            QRCodeData qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
            QRCode qrCode = new QRCode(qrCodeData);
            System.Drawing.Image img = qrCode.GetGraphic(20);
            using (var stream = new MemoryStream())
            {
                img.Save(stream, ImageFormat.Png);
                return Convert.ToBase64String(stream.ToArray());
            }
        }

        private void CreateSessionData(string sessionID, string qr, string user)
        {
            _sessionService.Create(sessionID, qr, user);
        }

        [HttpPost("AddSong")]
        public async Task<IActionResult> AddSong(string sessionID, string user, string uri)
        {
            Session session = _sessionService.Get(sessionID);
            session.AddSong(user, uri);
            _sessionService.Update(sessionID, session);

            await _hubContext.Clients.Group(sessionID).BroadcastQueue();
            return NoContent();
        }

        [HttpPost("AddUser")]
        public async Task<object> AddUser(string sessionID, string user, string connectionID, bool reconnect = false)
        {
            try
            {
                string qr = string.Empty;
                if (!reconnect)
                {
                    Session session = _sessionService.Get(sessionID);
                    session.AddUser(user);
                    _sessionService.Update(sessionID, session);
                    qr = session.GetQr();
                }
                await _hubContext.Groups.AddToGroupAsync(connectionID, sessionID);
                await _hubContext.Clients.Group(sessionID).BroadcastUsers();
                return new { qr = qr };
            }
            catch (Exception e)
            {
                _logger.LogError("AddUser Error", e);
            }
        }

        [HttpGet("GetQueue")]
        public List<Song> GetQueue(string sessionID)
        {
            Session session = _sessionService.Get(sessionID);
            List<Song> queue = session.GetSongs();
            _sessionService.Update(sessionID, session);
            return queue;
        }

        [HttpGet("GetUsers")]
        public OrderedDictionary GetUsers(string sessionID)
        {
            Session session = _sessionService.Get(sessionID);
            OrderedDictionary users = session.GetUsers();
            return users;
        }

        [HttpPost("RemoveSong")]
        public async Task<IActionResult> RemoveSong(string sessionID, int songIndex)
        {
            Session session = _sessionService.Get(sessionID);
            session.RemoveSong(songIndex);
            _sessionService.Update(sessionID, session);
            await _hubContext.Clients.Group(sessionID).BroadcastQueue();
            return NoContent();
        }

        [HttpPost("ReorderQueue")]
        public async Task<IActionResult> ReorderQueue(string sessionID, int from, int songIndex, int newIndex)
        {
            Session session = _sessionService.Get(sessionID);
            session.Reorder(songIndex, newIndex);
            _sessionService.Update(sessionID, session);
            await _hubContext.Clients.Group(sessionID).BroadcastQueue();
            return NoContent();
        }

        [HttpGet("GetSong")]
        public async Task<object> GetSong(string token, string song)
        {
            var spotify = new SpotifyClient(token);
            var track = await spotify.Tracks.Get(song);
            return track;
        }

        [HttpPost("Playback")]
        public async Task<IActionResult> Playback(string sessionID)
        {
            await _hubContext.Clients.Group(sessionID).BroadcastPlayback();
            return NoContent();
        }

        [HttpPost("Progress")]
        public async Task<IActionResult> Progress(string sessionID, int progress)
        {
            await _hubContext.Clients.Group(sessionID).BroadcastProgress(progress);
            return NoContent();
        }

        [HttpPost("NowPlaying")]
        public async Task<IActionResult> NowPlaying(string sessionID, string token)
        {
            var spotify = new SpotifyClient(token);
            var currentlyPlaying = await spotify.Player.GetCurrentlyPlaying(new PlayerCurrentlyPlayingRequest());
            await _hubContext.Clients.Group(sessionID).BroadcastNowPlaying((FullTrack)currentlyPlaying.Item, currentlyPlaying.ProgressMs, currentlyPlaying.IsPlaying);
            return NoContent();
        }

        [HttpGet("Callback")]
        public async Task<IActionResult> Callback(string code, string state)
        {
            string baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";
            var preUri = string.Concat(baseUrl, "/Queue/Callback");
            var uri = new Uri(preUri);

            var clientId = _iConfig.GetValue<string>("Spotify:ClientId");
            var clientSecret = _iConfig.GetValue<string>("Spotify:ClientSecret");
            var response = await new OAuthClient().RequestToken(
                new AuthorizationCodeTokenRequest(clientId, clientSecret, code, uri));
            var spotify = new SpotifyClient(response.AccessToken);
            var front = _iConfig.GetValue<string>("URL").Contains("localhost") ? state + "/" : _iConfig.GetValue<string>("URL");
            var url = front + $"callback?access_token={response.AccessToken}&token_type={response.TokenType}&expires_in={response.ExpiresIn}";
            //trigger workflow
            return Redirect(url);
        }

        private Session DeserializeSession(string sessionID)
        {
            string contentRootPath = (string)AppDomain.CurrentDomain.GetData("ContentRootPath");
            string path = Path.Combine(contentRootPath, @"Sessions/" + sessionID + ".json");
            if (!sessionLocks.ContainsKey(sessionID))
            {
                sessionLocks[sessionID] = new object();
            }
            lock (sessionLocks[sessionID])
            {
                var jsonString = "{}";
                if (System.IO.File.Exists(path))
                {
                    using (FileStream fs = System.IO.File.Open(path, FileMode.Open, FileAccess.Read, FileShare.None))
                    using (var sr = new StreamReader(fs))
                    {
                        jsonString = sr.ReadToEnd();
                    }
                }
                return JsonSerializer.Deserialize<Session>(jsonString);
            }
        }

        private void ReserializeSession(string sessionID, Session session)
        {
            if (session.GetUsers() != null)
            {
                string contentRootPath = (string)AppDomain.CurrentDomain.GetData("ContentRootPath");
                string path = Path.Combine(contentRootPath, @"Sessions/" + sessionID + ".json");
                lock (sessionLocks[sessionID])
                {
                    using (FileStream fs = System.IO.File.Open(path, FileMode.Create, FileAccess.ReadWrite, FileShare.None))
                    {
                        var options = new JsonSerializerOptions { WriteIndented = true };
                        byte[] info = JsonSerializer.SerializeToUtf8Bytes(session, options);
                        fs.Write(info, 0, info.Length);
                    }
                }
            }
        }
    }
}
