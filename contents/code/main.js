/*
 *    Name: Shortcuts for KDE's built-in tiling manager
 *    Description: Returns a Maximized window to its previously assigned tile upon unmaximization and adds shortcuts to assign windows to tiles as well as shortcuts to navigate between tiles. Supports Multimonitor setups now.
 *    Author: Seid Gicic
 *    E-Mail: s.gicic@outlook.com
 *    Version: 1.2.1
 *    License: GPLv3
 */

var tileList = [];

//init function
function init(){
    var clients = workspace.windowList();
    for (var i = 0; i < clients.length; i++){
        if (clients[i].tile != null){
            setupWindowConnections(clients[i]);
        }
    }

    //loop through screens and setup connections
    workspace.screens.forEach((ascreen) => {
        var tileManager = workspace.tilingForScreen(ascreen);
        tileManager.rootTile.layoutModified.connect(assignNumbersToTiles);
        tileManager.rootTile.childTilesChanged.connect(assignNumbersToTiles);
    });

    assignNumbersToTiles();
    registerShortcuts();
}

//counts through all tiles and assigns numbers
function assignNumbersToTiles(){
    tileList = [];
    const counter = { current: 1 };

    workspace.screens.forEach((ascreen) => {
        var rootTile = workspace.tilingForScreen(ascreen).rootTile;

        rootTile.tiles.forEach((tile) => {
            loopThroughTiles(tile, counter);
        });
    });
}

//recursively loop through tiles and their children
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

//applies a tile's geometry data to a window
function assignWindowToTile(clientwindow, tileNr){
    if (clientwindow.normalWindow && clientwindow.tile != tileList[tileNr-1].tile){
        var selectedtile = tileList[tileNr-1].tile;
        //swap windows if selected tile already has a window and clientwindow is in a tile
        if (selectedtile.windows.length > 0 && clientwindow.tile != null){
            var windowAlreadyInTile = getRelevantWindow(selectedtile.windows);
            if (windowAlreadyInTile != null){
                windowAlreadyInTile.frameGeometry.x = clientwindow.frameGeometry.x;
                windowAlreadyInTile.frameGeometry.y = clientwindow.frameGeometry.y;
                windowAlreadyInTile.frameGeometry.height = clientwindow.frameGeometry.height;
                windowAlreadyInTile.frameGeometry.width = clientwindow.frameGeometry.width;
                windowAlreadyInTile.tile = clientwindow.tile;
                windowAlreadyInTile.desktops = [workspace.currentDesktop];
                workspace.raiseWindow(windowAlreadyInTile);
            }
        }
        if (clientwindow.size.height == clientwindow.output.geometry.height && clientwindow.size.width == clientwindow.output.geometry.width){
            clientwindow.setMaximize(false,false);
        }
        clientwindow.frameGeometry.x = selectedtile.absoluteGeometry.x+selectedtile.padding;
        clientwindow.frameGeometry.y = selectedtile.absoluteGeometry.y+selectedtile.padding;
        clientwindow.frameGeometry.width = selectedtile.absoluteGeometry.width-selectedtile.padding*2;
        clientwindow.frameGeometry.height = selectedtile.absoluteGeometry.height-selectedtile.padding*2;
        clientwindow.tile = selectedtile;
        clientwindow.desktops = [workspace.currentDesktop];
        workspace.raiseWindow(clientwindow);
        //save old values as well, because maximize signals get called again because of the setMaximize call above
        //setMaximize needs to be called since it's the only way to change the read-only value of the maximizable property
        clientwindow.oldx = selectedtile.absoluteGeometry.x+selectedtile.padding;
        clientwindow.oldy = selectedtile.absoluteGeometry.y+selectedtile.padding;
        clientwindow.oldheight = selectedtile.absoluteGeometry.height-selectedtile.padding*2;
        clientwindow.oldwidth = selectedtile.absoluteGeometry.width-selectedtile.padding*2;
        clientwindow.oldtile = selectedtile;
    }
}

//return a window to its previous tile
function returnToTile(clientwindow){
    clientwindow.frameGeometry.x = clientwindow.oldx;
    clientwindow.frameGeometry.y = clientwindow.oldy;
    clientwindow.frameGeometry.width = clientwindow.oldwidth;
    clientwindow.frameGeometry.height = clientwindow.oldheight;
    clientwindow.tile = clientwindow.oldtile;
    clientwindow.desktops = [workspace.currentDesktop];
}

//gets a window from a windowlist that is on the current Desktop and in the topmost stacking position
function getRelevantWindow(windows){
    var windowtoReturn = null;
    windows.forEach((awindow) => {
        if (awindow.desktops[0] == workspace.currentDesktop){
            if (!windowtoReturn){
                windowtoReturn = awindow;
            }else if(awindow.stackingOrder > windowtoReturn.stackingOrder){
                windowtoReturn = awindow;
            }
        }
    });
    return windowtoReturn;
}

//activates a window on a specific tile
function activateTile(tilenumber){
    var windowToActivate = getRelevantWindow(tileList[tilenumber-1].tile.windows);
    workspace.activeWindow = windowToActivate;
}

//shortcuts
function registerShortcuts(){
    //Meta+(Function key) to assign a window to a tile, Ctrl+number to activate a window on a specific tile.
    var numbers = [1,2,3,4,5,6,7,8,9,10];
    numbers.forEach((number) => {
        registerShortcut("Assign to Tile "+number, "Assign to Tile "+number, "Meta+F"+number, function(){assignWindowToTile(workspace.activeWindow, number)});

        if (number == 10){
            registerShortcut("Activate Tile 10", "Activate Tile 10", "Ctrl+0", function(){activateTile(0)});
        }else{
            registerShortcut("Activate Tile "+number, "Activate Tile "+number, "Ctrl+"+number, function(){activateTile(number)});
        }
    });
}

//save old geometry data in client's properties
function saveOldData(client, bypasscheck){
    if (client.size.height == client.output.geometry.height && client.size.width == client.output.geometry.width){
        //about to change from maximized to unmaximized, do nothing
    }else{
        //about to change from tile location/size to maximized, save the tile window geometry so it can be restored later
        client.oldx = client.frameGeometry.x;
        client.oldy = client.frameGeometry.y;
        client.oldheight = client.frameGeometry.height;
        client.oldwidth = client.frameGeometry.width;
        client.oldtile = client.tile;
    }
    // remove assigned tile if window is moved with mouse
    if (client.move){
        client.tile = null;
    }
}

//restore old geometry data from a client
function restoreOldData(client){
    if (client.size.height == client.output.geometry.height && client.size.width == client.output.geometry.width){
        //changed from tile to maximized, do nothing
    }else{
        //changed from maximized to tile, apply previously saved geometry data
        assignWindowToTile(client, "returnToTile");
    }
}

//setup connections for a window
function setupWindowConnections(client){
    client.maximizedChanged.connect(function(){
        restoreOldData(client);
    });
    client.frameGeometryChanged.connect(function(){
        saveOldData(client);
    });
}

workspace.windowAdded.connect(setupWindowConnections);
init();


