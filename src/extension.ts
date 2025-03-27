import * as vscode from "vscode";
import * as http from "http";
import { IncomingMessage } from "http";

// Activation function called when extension is activated
export function activate(context: vscode.ExtensionContext) {
  // Register the command to send text to Local TTS
  const disposable = vscode.commands.registerCommand("vscode-local-tts.sendToLocalTTS", () => {
    sendToLocalTTS();
  });

  context.subscriptions.push(disposable);
}

// Function to send selected text to local TTS
async function sendToLocalTTS() {
  // Get active text editor
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active text editor found");
    return;
  }

  // Get selected text
  const selection = editor.selection;
  const text = editor.document.getText(selection);

  if (!text) {
    vscode.window.showWarningMessage("No text selected");
    return;
  }

  // Get API port from configuration
  const config = vscode.workspace.getConfiguration("vscode-local-tts");
  const apiPort = config.get<string>("apiPort") || "7891";

  try {
    // Create status bar message
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = `$(megaphone) Sending text to TTS...`;
    statusBarItem.show();

    // Make HTTP request using Node.js http module
    const postData = JSON.stringify({ text });

    await new Promise<void>((resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: apiPort,
          path: "/tts",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
          },
        },
        (res: IncomingMessage) => {
          let data = "";

          res.on("data", (chunk: Buffer) => {
            data += chunk.toString();
          });

          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve();
            } else {
              reject(new Error(`HTTP Error: ${res.statusCode}`));
            }
          });
        }
      );

      req.on("error", (error: Error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });

    // Hide status bar after a few seconds
    setTimeout(() => {
      statusBarItem.hide();
      statusBarItem.dispose();
    }, 3000);

    // Show success message
    vscode.window.showInformationMessage("Text sent to TTS successfully");
  } catch (error) {
    // Handle errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    vscode.window.showErrorMessage(`Failed to send to TTS: ${errorMessage}`);
    console.error("TTS Error:", error);
  }
}

// Deactivation function called when extension is deactivated
export function deactivate() {}
