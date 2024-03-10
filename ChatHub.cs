using Microsoft.AspNetCore.SignalR;

namespace SignalRSimpleChat;

public class ChatHub : Hub
{
    public const string HubUrl = "/chathub";
    public const string SendToAllClient = "SendToAllClient";

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public async Task SendToAll(string from, string message)
    {
        await Clients.All.SendAsync( SendToAllClient, from, message);
    }
}