# VS Code Local TTS Extension

A simple VS Code extension that sends selected text to a local Text-to-Speech (TTS) service.

## Features

- Right-click on selected text to access the "Text-to-Speech" submenu
- Send text to a local TTS service running on your machine
- Configure the port for the TTS service

## Usage

1. Select text in the editor
2. Right-click to open the context menu
3. Navigate to "Text-to-Speech" > "Send to Local TTS"
4. The selected text will be sent to your local TTS service

## Requirements

- A local TTS service running on http://127.0.0.1:7891/tts (port can be configured)
- The TTS service should accept POST requests with JSON body in the format: `{ "text": "your text here" }`

## Extension Settings

This extension contributes the following settings:

- `vscode-local-tts.apiPort`: Port number for the local TTS API (default: 7891)

## Development

1. Clone the repository
2. Run `yarn` to install dependencies
3. Open the project in VS Code
4. Press F5 to start debugging
5. Make changes and test

## Building

Run `yarn compile` to build the extension.
