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
            string sessionQR = SessionQR();
            string url = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";
            return sessionQR;
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

        private string SessionQR()
        {
            QRCodeGenerator qrGenerator = new QRCodeGenerator();
            QRCodeData qrCodeData = qrGenerator.CreateQrCode($"{Request.Scheme}://{Request.Host}{Request.PathBase}", QRCodeGenerator.ECCLevel.Q);
            QRCode qrCode = new QRCode(qrCodeData);
            Image img = qrCode.GetGraphic(20);
            using (var stream = new MemoryStream())
            {
                img.Save(stream, ImageFormat.Png);
                return Convert.ToBase64String(stream.ToArray());
            }
        }

        private void SessionData(string sessionID)
        {
            string path = @"..\Sessions\" + sessionID + ".json";
            // Create the file, or overwrite if the file exists.
            using (FileStream fs = System.IO.File.Create(path))
            {
                byte[] info = new UTF8Encoding(true).GetBytes("This is some text in the file.");
                // Add some information to the file.
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
