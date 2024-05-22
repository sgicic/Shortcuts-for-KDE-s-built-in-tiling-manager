var x;
var y;
var height;
var width;
var tile;
var desktop;
var tileList;


function init(){
    var clients = workspace.windowList();
    for (var i = 0; i < clients.length; i++){
        if (clients[i].tile != null){
            setupConnection(clients[i]);
        }
    }
    assignNumbersToTiles();
    registerShortcuts();
}

function assignNumbersToTiles(){
    const counter = { current: 1 };
    var rootTile = workspace.tilingForScreen(workspace.activeScreen).rootTile;
    tileList = [];
    rootTile.tiles.forEach((tile) => {
        loopThroughTiles(tile, counter);
    });
}


function loopThroughTiles(parentTile, counter){
    if (parentTile.tiles.length != 0){
        parentTile.tiles.forEach((childtile)=>{
            loopThroughTiles(childtile, counter);
        });
    }else{
        tileList.push({number: counter.current, tile: parentTile});
        parentTile.childTilesChanged.connect(assignNumbersToTiles);
        counter.current++;
    }
}

function assignWindowToTile(clientwindow, tileNr){
    if (tileNr == "returnToTile"){
        clientwindow.frameGeometry.x = x;
        clientwindow.frameGeometry.y = y;
        clientwindow.frameGeometry.width = width;
        clientwindow.frameGeometry.height = height;
        clientwindow.tile = tile;
        clientwindow.desktops[0] = desktop;
    }else{
        var selectedtile = tileList[tileNr-1].tile;
        clientwindow.frameGeometry.x = selectedtile.absoluteGeometry.x;
        clientwindow.frameGeometry.y = selectedtile.absoluteGeometry.y;
        clientwindow.frameGeometry.width = selectedtile.absoluteGeometry.width;
        clientwindow.frameGeometry.height = selectedtile.absoluteGeometry.height;
        clientwindow.tile = selectedtile;
        clientwindow.desktops[0] = workspace.currentDesktop;
    }
}

function activateTile(tilenumber){
    var length = tileList[tilenumber-1].tile.windows.length;
    var windows = tileList[tilenumber-1].tile.windows;
    for (var i = windows.length-1; i > -1; i--){
        if (windows[i].desktops[0] === workspace.currentDesktop){
            //Only activate a window if it's on the currently active Desktop.
            //Loop Backwards so a newly added window will be selected before older ones on the same tile
            workspace.raiseWindow(windows[i]);
            workspace.activeWindow = windows[i];
            break;
        }
    }
}

function registerShortcuts(){
    var numbers = [1,2,3,4,5,6,7,8,9];
    numbers.forEach((number) => {
        registerShortcut("Assign to Tile "+number, "Assign to Tile "+number, "Meta+F"+number, function(){assignWindowToTile(workspace.activeWindow, number)});

        registerShortcut("Activate Tile "+number, "Activate Tile "+number, "Ctrl+"+number, function(){activateTile(number)});
    })
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
                desktop = client.desktops[0];
                tile = client.tile;
            }
        });
        client.maximizedChanged.connect(function(){
            if (client.size.height == workspace.virtualScreenSize.height && client.size.width == workspace.virtualScreenSize.width){
                //changed from tile to maximized, do nothing
            }else{
                //changed from maximized to tile, apply previously saved geometry data
                assignWindowToTile(client, "returnToTile");
            }
        });
    });
}

var tileManager = workspace.tilingForScreen(workspace.activeScreen);
tileManager.rootTile.layoutModified.connect(assignNumbersToTiles);

workspace.currentDesktopChanged.connect(assignNumbersToTiles);

init();

