var x;
var y;
var height;
var width;
var tile;

var clients = workspace.windowList();
for (var i = 0; i < clients.length; i++){
    if (clients[i].tile != null){
        setupConnection(clients[i]);
    }

}

workspace.windowAdded.connect(setupConnection);

function setupConnection(client){
    client.tileChanged.connect(function(){
        client.maximizedAboutToChange.connect(function(){
            if (client.size.height == workspace.virtualScreenSize.height && client.size.width == workspace.virtualScreenSize.width){
                //about to change from maximized to unmaximized, do nothing
            }else{
                //about to change from tile location/size to maximized, save the tile window geometry so it can be restored later
                x = client.frameGeometry.x;
                y = client.frameGeometry.y;
                height = client.frameGeometry.height;
                width = client.frameGeometry.width;
                tile = client.tile;
            }
        });
        client.maximizedChanged.connect(function(){
            if (client.size.height == workspace.virtualScreenSize.height && client.size.width == workspace.virtualScreenSize.width){
                //changed from tile to maximized, do nothing
            }else{
                //changed from maximized to tile, apply previously saved geometry data
                client.frameGeometry.x = x;
                client.frameGeometry.y = y;
                client.frameGeometry.width = width;
                client.frameGeometry.height = height;
                client.tile = tile;
            }
        });
    });
}
