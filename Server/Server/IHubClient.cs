using System.Threading.Tasks;

namespace Server
{
    public interface IHubClient
    {
        Task BroadcastMessage();
    }
}