// TODO: independent interpreter for modding

// type Command =
//     { indent: number }
//     & (
//         | { code: 101, parameters: [string, number, number, number] } // Message Params
//         | { code: 401, parameters: [string] } // Message
//         | { code: 355, parameters: [string] } // Code
//         | { code: 655, parameters: [string] } // Code Continuation
//         | { code: 0, parameters: [] } // End
//     )



// export default class GameInterpreterAPI {
//     static gameInterpreter;

//     static async launch(commands: Command[]) {

//     }
// }

export default undefined;

// // 1. Ensure the scene has a _spriteset container (required by the plugin)
// if (!SceneManager._scene._spriteset) {
//     // Create a container sprite for the busts
//     SceneManager._scene._spriteset = new Sprite();
//     // Add it to the scene (behind the message window usually)
//     SceneManager._scene.addChild(SceneManager._scene._spriteset);
// }
// if (!SceneManager._scene._spriteset._messageBustSprites) {
//     var spriteset = SceneManager._scene._spriteset;
//     spriteset._messageBustSprites = [null];
    
//     for (var i = 1; i <= 10; i++)
//         spriteset._messageBustSprites[i] = new Sprite_VisualNovelBust(i);
// }

// const msg = new Window_Message();
// SceneManager._scene._messageWindow = msg;
// SceneManager._scene.addChild(msg);

// const list = [
//     // Message 1: Settings (Face name, index, background, position)
//     { code: 101, indent: 0, parameters: ["", 0, 0, 1] }, 
//     { code: 401, indent: 0, parameters: ["\\m[vtuto]Psst!"] },
    
//     // Message 2
//     { code: 101, indent: 0, parameters: ["", 0, 0, 1] },
//     { code: 401, indent: 0, parameters: ["\\m[vtuto]How are you today?"] },
    
//     // End of list
//     { code: 0, indent: 0, parameters: [] }
// ];
// const interpreter = new Game_Interpreter();
// interpreter.setup(list);

// const _oldUpdate = SceneManager._scene.update;
// SceneManager._scene.update = function() {
//     _oldUpdate.call(this)
//     if (interpreter.isRunning()) interpreter.update()
// }

// const _oldTerminate = msg.terminateMessage;
// msg.terminateMessage = function() {
//     _oldTerminate.call(this);
//     console.log("The message window just finished!");
//     msg.terminateMessage = _oldTerminate
// };