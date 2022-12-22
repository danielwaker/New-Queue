using System.Threading.Tasks;

namespace Server
{
    public interface IHubClient
    {
        Task BroadcastQueue();
        Task BroadcastUsers();
        Task BroadcastPlayback();
        Task BroadcastEnd();
        Task BroadcastNowPlaying(object playing);
    }
}