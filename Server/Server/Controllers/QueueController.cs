using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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
            // Open the stream and read it back.
            /*using (StreamReader sr = System.IO.File.OpenText(path))
            {
                string s = "";
                while ((s = sr.ReadLine()) != null)
                {
                    Console.WriteLine(s);
                }
            }*/
        }
    }
}
