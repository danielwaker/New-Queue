using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
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
        private readonly IHubContext<BroadcastHub, IHubClient> _hubContext;
        private readonly IConfiguration _iConfig;
        public QueueController(IHubContext<BroadcastHub, IHubClient> hubContext, IConfiguration iConfig)
        {
            _hubContext = hubContext;
            _iConfig = iConfig;
        }

        [HttpGet("CreateSession")]
        public object CreateSession(string user, string connectionID)
        {
            string sessionID = SessionID();
            //string url = $"{Request.Scheme}://{Request.Host}{Request.PathBase}?sessionID={sessionID}";
            string url = _iConfig.GetValue<string>("URL") + $"login?sessionID={sessionID}";
            string sessionQR = SessionQR(url);
            CreateSessionData(sessionID, user);
            _hubContext.Groups.AddToGroupAsync(connectionID, sessionID);
            return new
            {
                sessionID = sessionID,
                sessionQR = sessionQR
            };
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

        private void CreateSessionData(string sessionID, string user)
        {
            string contentRootPath = (string)AppDomain.CurrentDomain.GetData("ContentRootPath");
            string path = Path.Combine(contentRootPath, @"Sessions/" + sessionID + ".json");

            using (FileStream fs = System.IO.File.Create(path))
            {
                Session hi = new Session(sessionID, user);
                var options = new JsonSerializerOptions { WriteIndented = true };
                byte[] info = JsonSerializer.SerializeToUtf8Bytes(hi, options);
                fs.Write(info, 0, info.Length);
            }
        }

        [HttpPost("AddSong")]
        public async Task<IActionResult> AddSong(string sessionID, string user, string uri)
        {
            Session session = DeserializeSession(sessionID);
            session.AddSong(user, uri);
            ReserializeSession(sessionID, session);

            await _hubContext.Clients.Group(sessionID).BroadcastQueue();
            return NoContent();
        }

        [HttpPost("AddUser")]
        public async Task<IActionResult> AddUser(string sessionID, string user, string connectionID, bool reconnect = false)
        {
            if (!reconnect)
            {
                Session session = DeserializeSession(sessionID);
                session.AddUser(user);
                ReserializeSession(sessionID, session);
            }
            await _hubContext.Groups.AddToGroupAsync(connectionID, sessionID);
            await _hubContext.Clients.Group(sessionID).BroadcastUsers();
            return NoContent();
        }

        [HttpGet("GetQueue")]
        public List<Song> GetQueue(string sessionID)
        {
            Session session = DeserializeSession(sessionID);
            List<Song> queue = session.GetSongs();
            ReserializeSession(sessionID, session);
            return queue;
        }

        [HttpGet("GetUsers")]
        public OrderedDictionary GetUsers(string sessionID)
        {
            Session session = DeserializeSession(sessionID);
            OrderedDictionary users = session.GetUsers();
            ReserializeSession(sessionID, session);
            return users;
        }

        [HttpPost("RemoveSong")]
        public void RemoveSong(string sessionID, int songIndex)
        {
            Session session = DeserializeSession(sessionID);
            session.RemoveSong(songIndex);
            ReserializeSession(sessionID, session);
        }

        [HttpGet("GetSong")]
        public async Task<object> GetSong(string token, string song)
        {
            var spotify = new SpotifyClient(token);
            var track = await spotify.Tracks.Get(song);
            return track;
        }

        [HttpGet("Callback")]
        public async Task<IActionResult> Callback(string code, string state)
        {
            string baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";
            var preUri = string.Concat(baseUrl, "/Queue/Callback");
            var uri = new Uri(preUri);

            var response = await new OAuthClient().RequestToken(
                new AuthorizationCodeTokenRequest("5794ad59a90744c9aba2ca18cd73bc10", "8a1204cb1f0042679933dcd724ab919f", code, uri));
            var spotify = new SpotifyClient(response.AccessToken);
            var url = _iConfig.GetValue<string>("URL") + $"callback?access_token={response.AccessToken}&token_type={response.TokenType}&expires_in={response.ExpiresIn}";
            //trigger workflow
            return Redirect(url);
        }

        private Session DeserializeSession(string sessionID)
        {
            string contentRootPath = (string)AppDomain.CurrentDomain.GetData("ContentRootPath");
            string path = Path.Combine(contentRootPath, @"Sessions/" + sessionID + ".json");
            var jsonString = (System.IO.File.Exists(path)) ? System.IO.File.ReadAllText(path) : "{}";
            return JsonSerializer.Deserialize<Session>(jsonString);
        }

        private void ReserializeSession(string sessionID, Session session)
        {
            if (session.GetUsers() != null)
            {
                string contentRootPath = (string)AppDomain.CurrentDomain.GetData("ContentRootPath");
                string path = Path.Combine(contentRootPath, @"Sessions/" + sessionID + ".json");
                using (FileStream fs = System.IO.File.Open(path, FileMode.Create))
                {
                    var options = new JsonSerializerOptions { WriteIndented = true };
                    byte[] info = JsonSerializer.SerializeToUtf8Bytes(session, options);
                    fs.Write(info, 0, info.Length);
                }
            }
        }
    }
}
