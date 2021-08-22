﻿using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using QRCoder;
using System;
using System.Collections.Generic;
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
        public QueueController(IHubContext<BroadcastHub, IHubClient> hubContext)
        {
            _hubContext = hubContext;
        }
        [HttpGet("CreateSession")]
        public object CreateSession(string user)
        {
            string sessionID = SessionID();
            string url = $"{Request.Scheme}://{Request.Host}{Request.PathBase}?sessionID={sessionID}";
            string sessionQR = SessionQR(url);
            CreateSessionData(sessionID, user);
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
            Image img = qrCode.GetGraphic(20);
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

            Notification notification = new Notification()
            {
                Test1 = "test1",
                Test2 = "test2"
            };
            await _hubContext.Clients.All.BroadcastMessage();

            return NoContent();
        }

        [HttpPost("AddUser")]
        public void AddUser(string sessionID, string user)
        {
            Session session = DeserializeSession(sessionID);
            session.AddUser(user);
            ReserializeSession(sessionID, session);
        }

        [HttpGet("GetQueue")]
        public List<Song> GetQueue(string sessionID)
        {
            Session session = DeserializeSession(sessionID);
            List<Song> queue = session.GetSongs();
            ReserializeSession(sessionID, session);
            return queue;
        }

        private Session DeserializeSession(string sessionID)
        {
            string contentRootPath = (string)AppDomain.CurrentDomain.GetData("ContentRootPath");
            string path = Path.Combine(contentRootPath, @"Sessions/" + sessionID + ".json");
            var jsonString = System.IO.File.ReadAllText(path);
            return JsonSerializer.Deserialize<Session>(jsonString);
        }

        private void ReserializeSession(string sessionID, Session session)
        {
            string contentRootPath = (string)AppDomain.CurrentDomain.GetData("ContentRootPath");
            string path = Path.Combine(contentRootPath, @"Sessions/" + sessionID + ".json");
            using (FileStream fs = System.IO.File.Open(path, FileMode.Open))
            {
                var options = new JsonSerializerOptions { WriteIndented = true };
                byte[] info = JsonSerializer.SerializeToUtf8Bytes(session, options);
                fs.Write(info, 0, info.Length);
            }
        }
    }
}
