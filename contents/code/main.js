/*
 *    Name: Shortkuts (Shortcuts for KDE's built-in tiling manager)
 *    Description: Returns a Maximized window to its previously assigned tile upon unmaximization and adds shortcuts to assign windows to tiles as well as shortcuts to navigate between tiles. Supports Multimonitor setups now.
 *    Author: Seid Gicic
 *    E-Mail: s.gicic@outlook.com
 *    Version: 1.0
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

    //loop through screens and setup connections for their tiles
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
        clientwindow.setMaximize(false,false);
        clientwindow.frameGeometry.x = selectedtile.absoluteGeometry.x+selectedtile.padding;
        clientwindow.frameGeometry.y = selectedtile.absoluteGeometry.y+selectedtile.padding;
        clientwindow.frameGeometry.width = selectedtile.absoluteGeometry.width-selectedtile.padding*2;
        clientwindow.frameGeometry.height = selectedtile.absoluteGeometry.height-selectedtile.padding*2;
        clientwindow.tile = selectedtile;
        clientwindow.desktops = [workspace.currentDesktop];
        workspace.raiseWindow(clientwindow);
    }
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
function saveOldData(client){
    client.oldx = client.frameGeometry.x;
    client.oldy = client.frameGeometry.y;
    client.oldheight = client.frameGeometry.height;
    client.oldwidth = client.frameGeometry.width;
    client.oldtile = client.tile;
}

//return a window to its previous tile
function restoreOldData(clientwindow){
    clientwindow.frameGeometry.x = clientwindow.oldx;
    clientwindow.frameGeometry.y = clientwindow.oldy;
    clientwindow.frameGeometry.width = clientwindow.oldwidth;
    clientwindow.frameGeometry.height = clientwindow.oldheight;
    clientwindow.tile = clientwindow.oldtile;
    clientwindow.desktops = [workspace.currentDesktop];
}

//setup connections for a window
function setupWindowConnections(client){

    //restore old data if window not fullscreen and was tiled before
    client.maximizedChanged.connect(function(){
        if (client.wasTiled && (client.height < client.output.geometry.height && client.width < client.output.geometry.width)){
            restoreOldData(client);
            client.tile = workspace.tilingForScreen(client.output).bestTileForPosition(client.x, client.y);
        }
    });

    //remove associated tile if window inside tile is moved by mouse. Found this was the more consistent compared to using that specific mouse move signal
    client.frameGeometryAboutToChange.connect(function(){
        if (client.move && client.tile != null){
            client.tile = null;
            client.wasTiled = false;
        }
    })

    client.frameGeometryChanged.connect(function(){
        //save olddata if window not fullscreen
        if (client.tile != null && (client.height < client.output.geometry.height && client.width < client.output.geometry.width)){
            saveOldData(client);
        }
        //set my own flag since client.tile gets removed before any of the signals fire
        if (client.tile){
            client.wasTiled = true;
        }
    })
}


workspace.windowAdded.connect(setupWindowConnections);
init();
workspace.screens.forEach((output)=>{
    output.wakeUp.connect(init);
});
