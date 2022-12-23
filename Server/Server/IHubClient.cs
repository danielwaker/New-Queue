using SpotifyAPI.Web;
using System.Threading.Tasks;

namespace Server
{
    public interface IHubClient
    {
        Task BroadcastQueue();
        Task BroadcastUsers();
        Task BroadcastPlayback();
        Task BroadcastEnd();
        Task BroadcastNowPlaying(FullTrack playing, int? progress, bool isPlaying);
        Task BroadcastProgress(int progress);
    }
}