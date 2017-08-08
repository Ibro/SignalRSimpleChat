using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace SignalRSimpleChat
{
    public class Chat : Hub
    {      
        public async Task Send(string nick, string message)
        {
            await Clients.All.InvokeAsync("Send", nick, message);
        }
    }
}
