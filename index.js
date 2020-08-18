const {setVibrancy: wSetVibrancy, disableVibrancy: wDisableVibrancy} = require("bindings")("vibrancy-wrapper");

const os = require("os");
const eBrowserWindow = require("electron").BrowserWindow;
const {nativeTheme, screen} = require("electron");
const supportedType = ['light', 'dark', 'appearance-based'];
const {getMonitorInfo} = require('display-info');

function isWindows10() {
    if (process.platform !== 'win32') return false;
    return os.release().split('.')[0] === '10';
}

function isRS4OrGreater() {
    if (!isWindows10()) return false;
    return !(os.release().split('.')[1] === '0' && parseInt(os.release().split('.')[2]) < 17134);
}

function getHwnd(win) {
    if (!win) throw new TypeError('WINDOW_NOT_GIVEN');
    try {
        const hbuf = win.getNativeWindowHandle();
        if (os.endianness() === "LE") {
            return hbuf.readInt32LE();
        } else {
            return hbuf.readInt32BE();
        }
    } catch (e) {
        throw new TypeError('NOT_VALID_WINDOW');
    }
}

class vBrowserWindow extends eBrowserWindow {
    constructor(props) {
        props.backgroundColor = '#00000000';
        props.show = false;
        const win = new eBrowserWindow(props);
        if (!isWindows10()) return eBrowserWindow; // Return an "official" BrowserWindow
        vBrowserWindow._bindAndReplace(win, vBrowserWindow.setVibrancy);

        let pollingRate = 0;
        let monitorInfo = getMonitorInfo();

        for (let i of monitorInfo) {
            if (i.frameRate > pollingRate) pollingRate = i.frameRate;
        }
        if (!pollingRate) pollingRate = 60;

        // Replace window moving behavior to fix mouse polling rate bug
        win.on('will-move', (e) => {
            e.preventDefault()

            // Track if the user is moving the window
            if (win._moveTimeout) clearTimeout(win._moveTimeout);
            win._moveTimeout = setTimeout(
                () => {
                    win._isMoving = false
                    clearInterval(win._moveInterval)
                    win._moveInterval = null
                }, 1000 / 60)

            // Start new behavior if not already
            if (!win._isMoving) {
                win._isMoving = true
                if (win._moveInterval) return false;

                // Get start positions
                win._moveLastUpdate = 0
                win._moveStartBounds = win.getBounds()
                win._moveStartCursor = screen.getCursorScreenPoint()

                // Poll at 600hz while moving window
                win._moveInterval = setInterval(() => {
                    const now = Date.now()
                    if (now >= win._moveLastUpdate + (1000 / pollingRate)) {
                        win._moveLastUpdate = now
                        const cursor = screen.getCursorScreenPoint()

                        // Set new position
                        win.setBounds({
                            x: win._moveStartBounds.x + (cursor.x - win._moveStartCursor.x),
                            y: win._moveStartBounds.y + (cursor.y - win._moveStartCursor.y),
                            width: win._moveStartBounds.width,
                            height: win._moveStartBounds.height
                        })
                    }
                }, 1000 / 600)
            }
        })

        // Replace window resizing behavior to fix mouse polling rate bug
        win.on('will-resize', (e, newBounds) => {
            const now = Date.now()
            if (!win._resizeLastUpdate) win._resizeLastUpdate = 0;
            if (now >= win._resizeLastUpdate + (1000 / pollingRate)) {
                win._resizeLastUpdate = now
            } else {
                e.preventDefault()
            }
        })

        if (isWindows10() && props.hasOwnProperty('vibrancy')) win.once('ready-to-show', () => {
            setTimeout(() => {
                win.show();
                win.setVibrancy(props.vibrancy);
            }, 100);
        });

        return win;
    }

    static setVibrancy(op = null) {
        if (op) this.setVibrancy(null);
        if (!isWindows10()) super.setVibrancy(op);
        else {
            if (op && supportedType.indexOf(op) === -1 && op[0] !== '#') op = 'appearance-based';
            if (op === 'appearance-based') {
                if (nativeTheme.shouldUseDarkColors) op = 'dark';
                else op = 'light';
            }
            let redValue, greenValue, blueValue, alphaValue;
            if (op === 'light') redValue = 255, greenValue = 255, blueValue = 255, alphaValue = 64;
            else if (op === 'dark') redValue = 0, greenValue = 0, blueValue = 0, alphaValue = 128;
            else if (op) redValue = parseInt(op.substring(1, 3), 16), greenValue = parseInt(op.substring(3, 5), 16), blueValue = parseInt(op.substring(5, 7), 16), alphaValue = parseInt(op.substring(7, 9), 16);
            if (op) wSetVibrancy(getHwnd(this), isRS4OrGreater() ? 1 : 0, redValue, greenValue, blueValue, alphaValue);
            else wDisableVibrancy(getHwnd(this));
        }
    }

    static _bindAndReplace(object, method) {
        const boundFunction = method.bind(object);
        Object.defineProperty(object, method.name, {
            get: () => boundFunction
        });
    }
}

function setVibrancy(win, op = 'appearance-based') {
    if (op) setVibrancy(win, null);
    if (!isWindows10()) win.setVibrancy(op);
    else {
        if (op && supportedType.indexOf(op) === -1 && op[0] !== '#') op = 'appearance-based';
        if (op === 'appearance-based') {
            if (nativeTheme.shouldUseDarkColors) op = 'dark';
            else op = 'light';
        }
        let redValue, greenValue, blueValue, alphaValue;
        if (op === 'light') redValue = 255, greenValue = 255, blueValue = 255, alphaValue = 64;
        else if (op === 'dark') redValue = 0, greenValue = 0, blueValue = 0, alphaValue = 128;
        else if (op) redValue = parseInt(op.subsstring(1, 3), 16), greenValue = parseInt(op.subsstring(3, 5), 16), blueValue = parseInt(op.subsstring(5, 7), 16), alphaValue = parseInt(op.subsstring(7, 9), 16);
        if (op) wSetVibrancy(getHwnd(this), isRS4OrGreater() ? 1 : 0, redValue, greenValue, blueValue, alphaValue);
        else wDisableVibrancy(getHwnd(this));
    }
}

function disableVibrancy(win) {
    setVibrancy(win, null);
}

exports.setVibrancy = setVibrancy;
exports.disableVibrancy = disableVibrancy;
exports.BrowserWindow = isWindows10() ? vBrowserWindow : eBrowserWindow;
