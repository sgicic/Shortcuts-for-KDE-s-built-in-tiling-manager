# KWin Script - Shortcuts for KDE's built-in tiling manager
Extends KDE's built-in tiling feature with shortcuts to quckly assign windows to tiles, as well as shortcuts to navigate between tiles and their respective windows. Also returns a maximized Window to its previously assigned tile upon unmaximization. Works on X11 as well as Wayland.
Windows in tiles are able to swap positions in the newest version.

# Default Shortcuts
The idea behind the script was to use the number and Function keys for the shortcuts, so naturally only 10 tiles are supported.

Meta+F1-10 assigns a window the specified tile.

Ctrl+0-9 activates the window assigned to that specific tile, where number 0 counts as 10.
