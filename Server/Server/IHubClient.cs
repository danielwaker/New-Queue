using System.Threading.Tasks;

namespace Server
{
    public interface IHubClient
    {
        Task BroadcastQueue();
        Task BroadcastUsers();
    }
}