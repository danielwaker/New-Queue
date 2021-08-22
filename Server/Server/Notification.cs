using System.ComponentModel.DataAnnotations.Schema;  
  
namespace Server
{
    public class Notification
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Test1 { get; set; }
        public string Test2 { get; set; }
    }
}