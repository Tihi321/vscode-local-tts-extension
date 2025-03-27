import * as vscode from "vscode";
import * as http from "http";
import { IncomingMessage } from "http";

// Create output channel for logging
let outputChannel: vscode.OutputChannel;

// Activation function called when extension is activated
export function activate(context: vscode.ExtensionContext) {
  // Initialize the output channel
  outputChannel = vscode.window.createOutputChannel("Local TTS");
  outputChannel.show();
  outputChannel.appendLine("Local TTS extension activated");

  // Register the command to send text to Local TTS
  const sendDisposable = vscode.commands.registerCommand("vscode-local-tts.sendToLocalTTS", () => {
    sendToLocalTTS();
  });

  // Register the command to stop Local TTS
  const stopDisposable = vscode.commands.registerCommand("vscode-local-tts.stopLocalTTS", () => {
    stopLocalTTS();
  });

  context.subscriptions.push(sendDisposable, stopDisposable, outputChannel);
}

// Helper function for logging
function log(message: string) {
  outputChannel.appendLine(message);
  console.log(message);
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
  log(`Using API port: ${apiPort}`);

  try {
    // Create status bar message
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = `$(megaphone) Sending text to TTS...`;
    statusBarItem.show();
    log(`Sending text to TTS: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`);

    // First check if the server is reachable
    log("Checking if server is reachable...");
    try {
      await checkServerIsUp(apiPort);
      log("Server is reachable");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      log(`Server check failed: ${errorMessage}`);
      vscode.window.showErrorMessage(
        `TTS server is not reachable at port ${apiPort}. Please make sure it's running.`
      );
      statusBarItem.hide();
      statusBarItem.dispose();
      return;
    }

    // Make HTTP request using Node.js http module
    const postData = JSON.stringify({ text });

    await new Promise<void>((resolve, reject) => {
      log(`Sending request to http://127.0.0.1:${apiPort}/tts`);

      // Log complete request details for debugging
      log(`Full request details:
        URL: http://127.0.0.1:${apiPort}/tts
        Method: POST
        Headers: Content-Type: application/json, Content-Length: ${Buffer.byteLength(postData)}
        Body: ${postData}
      `);

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
          timeout: 5000, // 5 second timeout
        },
        (res: IncomingMessage) => {
          log(`Response status code: ${res.statusCode}`);
          let data = "";

          res.on("data", (chunk: Buffer) => {
            data += chunk.toString();
          });

          res.on("end", () => {
            log(`Response data: ${data}`);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve();
            } else {
              reject(new Error(`HTTP Error: ${res.statusCode}`));
            }
          });
        }
      );

      req.on("error", (error: Error) => {
        log(`Request error: ${error.message}`);
        reject(error);
      });

      req.on("timeout", () => {
        log("Request timed out");
        req.destroy();
        reject(new Error("Request timed out"));
      });

      log("Writing request data...");
      req.write(postData);

      log("Ending request...");
      req.end();
      log("Request sent");
    });

    // Hide status bar after a few seconds
    setTimeout(() => {
      statusBarItem.hide();
      statusBarItem.dispose();
    }, 3000);

    // Show success message
    vscode.window.showInformationMessage("Text sent to TTS successfully");
    log("Text sent to TTS successfully");
  } catch (error) {
    // Handle errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    vscode.window.showErrorMessage(`Failed to send to TTS: ${errorMessage}`);
    log(`Failed to send to TTS: ${errorMessage}`);
  }
}

// Function to stop local TTS playback
async function stopLocalTTS() {
  // Get API port from configuration
  const config = vscode.workspace.getConfiguration("vscode-local-tts");
  const apiPort = config.get<string>("apiPort") || "7891";
  log(`Using API port for stop request: ${apiPort}`);

  try {
    // Create status bar message
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = `$(stop) Stopping TTS...`;
    statusBarItem.show();

    const url = `http://127.0.0.1:${apiPort}/stop`;
    log(`Sending stop request to ${url}`);

    // First check if the server is reachable
    log("Checking if server is reachable...");
    try {
      await checkServerIsUp(apiPort);
      log("Server is reachable");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      log(`Server check failed: ${errorMessage}`);
      vscode.window.showErrorMessage(
        `TTS server is not reachable at port ${apiPort}. Please make sure it's running.`
      );
      statusBarItem.hide();
      statusBarItem.dispose();
      return;
    }

    // Make HTTP request using Node.js http module
    const postData = JSON.stringify({});
    log(`Request payload: ${postData}`);

    await new Promise<void>((resolve, reject) => {
      // Log complete request details
      log(`Full request details:
        URL: ${url}
        Method: POST
        Headers: Content-Type: application/json, Content-Length: ${Buffer.byteLength(postData)}
        Body: ${postData}
      `);

      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: apiPort,
          path: "/stop",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
          },
          timeout: 5000, // 5 second timeout
        },
        (res: IncomingMessage) => {
          log(`Response status code: ${res.statusCode}`);
          let data = "";

          res.on("data", (chunk: Buffer) => {
            data += chunk.toString();
          });

          res.on("end", () => {
            log(`Response data: ${data}`);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve();
            } else {
              reject(new Error(`HTTP Error: ${res.statusCode}, Response: ${data}`));
            }
          });
        }
      );

      req.on("error", (error: Error) => {
        log(`Request error: ${error.message}`);
        reject(error);
      });

      req.on("timeout", () => {
        log("Request timed out");
        req.destroy();
        reject(new Error("Request timed out"));
      });

      // Log before writing data
      log("Writing request data...");
      req.write(postData);

      // Log before ending request
      log("Ending request...");
      req.end();
      log("Request sent");
    });

    // Hide status bar after a few seconds
    setTimeout(() => {
      statusBarItem.hide();
      statusBarItem.dispose();
    }, 3000);

    // Show success message
    vscode.window.showInformationMessage("TTS playback stopped successfully");
    log("TTS playback stopped successfully");
  } catch (error) {
    // Handle errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    vscode.window.showErrorMessage(`Failed to stop TTS: ${errorMessage}`);
    log(`TTS Stop Error: ${errorMessage}`);
  }
}

// Function to check if server is reachable
function checkServerIsUp(port: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: port,
        path: "/",
        method: "HEAD",
        timeout: 2000, // 2 second timeout
      },
      (_res) => {
        resolve(true);
      }
    );

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Connection timed out"));
    });

    req.end();
  });
}

// Deactivation function called when extension is deactivated
export function deactivate() {
  log("Local TTS extension deactivated");
}
