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
        public string CreateSession()
        {
            string sessionID = SessionID();
            string url = $"{Request.Scheme}://{Request.Host}{Request.PathBase}?sessionID={sessionID}";
            string sessionQR = SessionQR(url);
            
            return SessionData(sessionID);
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

        private string SessionData(string sessionID)
        {
            string contentRootPath = (string)AppDomain.CurrentDomain.GetData("ContentRootPath");
            string path = Path.Combine(contentRootPath, @"Sessions/" + sessionID + ".json");
            Console.WriteLine(path);
            // Create the file, or overwrite if the file exists.
            using (FileStream fs = System.IO.File.Create(path))
            {
                Session hi = new Session(sessionID, "joe");
                string jsonString = JsonSerializer.Serialize(hi);
                byte[] info = new UTF8Encoding(true).GetBytes(jsonString);
                // Add some information to the file.
                fs.Write(info, 0, info.Length);
            }
            return path;
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
