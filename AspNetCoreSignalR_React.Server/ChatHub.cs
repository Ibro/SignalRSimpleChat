using Microsoft.AspNetCore.SignalR;

namespace AspNetCoreSignalR_React.Server
{
    public class ChatHub : Hub
    {
        public void SendToAll(string name, string message)
        {
            Clients.All.InvokeAsync("sendToAll", name, message);
        }
    }
}