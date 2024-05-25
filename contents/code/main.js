/*
 *    Name: returnToTile
 *    Description: Returns a Maximized window to its previously assigned tile upon unmaximization and adds shortcuts to assign windows to tiles as well as shortcuts to navigate between tiles. Supports Multimonitor setups now.
 *    Author: Seid Gicic
 *    E-Mail: s.gicic@outlook.com
 *    Version: 1.2
 *    License: GPLv3
 */

var tileList = [];

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
        clientwindow.frameGeometry.x = clientwindow.oldx;
        clientwindow.frameGeometry.y = clientwindow.oldy;
        clientwindow.frameGeometry.width = clientwindow.oldwidth;
        clientwindow.frameGeometry.height = clientwindow.oldheight;
        clientwindow.tile = clientwindow.oldtile;
        clientwindow.desktops = [workspace.currentDesktop];
    }else{
        if (clientwindow.normalWindow && clientwindow.tile != tileList[tileNr-1].tile){
            clientwindow.setMaximize(false,false);
            var selectedtile = tileList[tileNr-1].tile;
            clientwindow.frameGeometry.x = selectedtile.absoluteGeometry.x+selectedtile.padding;
            clientwindow.frameGeometry.y = selectedtile.absoluteGeometry.y+selectedtile.padding;
            clientwindow.frameGeometry.width = selectedtile.absoluteGeometry.width-selectedtile.padding*2;
            clientwindow.frameGeometry.height = selectedtile.absoluteGeometry.height-selectedtile.padding*2;
            clientwindow.tile = selectedtile;
            clientwindow.desktops = [workspace.currentDesktop];
        }
    }
}

function activateTile(tilenumber){
    var length = tileList[tilenumber-1].tile.windows.length;
    var windows = tileList[tilenumber-1].tile.windows;

    for (var i = windows.length-1; i > -1; i--){
        windows[i].olddesktops = [workspace.currentDesktop];
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

function saveOldData(client){
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

function restoreOldData(client){
    if (client.size.height == client.output.geometry.height && client.size.width == client.output.geometry.width){
        //changed from tile to maximized, do nothing
    }else{
        //changed from maximized to tile, apply previously saved geometry data
        assignWindowToTile(client, "returnToTile");
    }
}

workspace.windowAdded.connect(setupWindowConnections);

function setupWindowConnections(client){
    saveOldData(client);
    client.maximizedChanged.connect(function(){
        restoreOldData(client);
    });
    client.frameGeometryChanged.connect(function(){
        saveOldData(client);
    });
}

init();


