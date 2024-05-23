/*
 *    Name: returnToTile
 *    Description: Returns a Maximized window to its previously assigned tile upon unmaximization and adds shortcuts to assign windows to tiles as well as shortcuts to navigate between tiles.
 *    Author: Seid Gicic
 *    Version: 1.1
 *    License: GPLv3
 */

//Todo: Add Multimonitor support (maybe)

var tileList = [];

function init(){
    var clients = workspace.windowList();
    for (var i = 0; i < clients.length; i++){
        if (clients[i].tile != null){
            setupTileConnection(clients[i]);
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
        if (clientwindow.normalWindow){
            var selectedtile = tileList[tileNr-1].tile;
            Object.keys(selectedtile).forEach((prop)=> print(prop));
            print(selectedtile.relativeGeometry);
            print(selectedtile.absoluteGeometry);
            print(selectedtile.absoluteGeometryInScreen);
            print(selectedtile.padding);
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
    print("-----------NEWHERE");
    print(workspace.activeScreen.geometry);
    Object.keys(workspace.activeScreen).forEach((prop)=> print(prop));
    for (var i = windows.length-1; i > -1; i--){
        windows[i].olddesktops = [workspace.currentDesktop];
        //   print(windows[i].desktops);
        //  print(windows[i].olddesktops);
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



function saveOldData(client){
    if (client.size.height == client.output.geometry.height && client.size.width == client.output.geometry.width){
        //about to change from maximized to unmaximized, do nothing
    }else{
        //about to change from tile location/size to maximized, save the tile window geometry so it can be restored later
        client.oldx = client.frameGeometry.x;
        client.oldy = client.frameGeometry.y;
        client.oldheight = client.frameGeometry.height;
        client.oldwidth = client.frameGeometry.width;
        //  client.olddesktop = client.currentDesktop;
        client.oldtile = client.tile;
        client.whatever = 100;
        print(client.oldx);
        print(client.oldy);
        print(client.oldheight);
        print(client.oldwidth);
        print(client.oldtile);
        print(client.whatever);
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




workspace.currentDesktopChanged.connect(assignNumbersToTiles);

workspace.windowAdded.connect(setupTileConnection);

function setupTileConnection(client){
    client.maximizedAboutToChange.connect(function(){
        saveOldData(client)
    });
    client.maximizedChanged.connect(function(){
        restoreOldData(client)
    });
    client.tileChanged.connect(function(){
        print("why is this here");
    });
}


init();


