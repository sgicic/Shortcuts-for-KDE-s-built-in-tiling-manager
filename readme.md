# KWin Script returnToTile
When using the new Tiles feature in KDE (Super+t), maximizing and subsequently unmaximizing a tiled window does not return the window to its previously asssigned tile. This Script "fixes" the issue (apparently it's intended behaviour). 

# Version 1.1
Adds Shortcuts to quickly assign windows to a tile(Meta+F1-10), as well as shortcuts to navigate between tiles(Ctrl+0-9).

# Version 1.2 
Supports Multimonitor Setups now.

# Important Issues
On wayland, the window placement of certain software can be buggy, which I assume is an issue with that software's wayland implementation.
