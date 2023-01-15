# ChatGPT Tool
A userscript for ChatGPT which adds:
1. A button to download current chat, including branches.
2. Buttons to embed code snippets in floating frames.

Feel free to examine the source code and suggest improvements.

### Installation
First, Install a browser extension for userscripts. I use Tampermonkey: https://www.tampermonkey.net/

Direct link to the userscript: https://raw.githubusercontent.com/itamarbledsoe/chatgpt-tool/main/cgptt.js
#### To install the userscript by importing it:
1. Open the options page or menu of the userscript manager of your choice.
2. Find the import option (in Tampermonkey it's under "Utilities")
3. Either import directly from the URL above, or download first and import the downloaded file.
#### Alternatively, you can just copy & paste the code.
1. Create a new userscript with your userscript manager.
2. Make sure to delete everything in the new userscript.
3. Copy the code from the file into your empty userscript.

### Usage
#### Downloading a Chat
1. When the page loads, the script should automatically add a "Download Chat" button on the top.
2. When you open a different chat, the button takes a moment to update.
3. After it's loaded, click the button to download a JSON file containing all the data of the current chat (much more than visible on the screen btw).
#### Embedding Code Snippets
1. When the page loads, the script should automatically add "Embed" buttons to code snippets in the chat.
2. Clicking an "Embed" button will create a floating frame running the code from the code block. It is treated as HTML.
3. You can close the floating frame, resize it, minimize it, or modify its code by clicking "Edit".
4. The frame will update when you click the "Edit" button again to close the editor, or when you press Ctrl+Enter.
5. I added another button for quickly adding/removing a style of white text on black background to the code. Was useful to me when working with SVGs.

### How it Works
#### Downloading a Chat
1. The script intercepts network requests in the page and copies the relevant parameters for reuse when downloading.
2. When clicking the button, it fetches the data, then updates a dedicated invisible link with a data URL, then fakes a click on it.
#### Embedding Code Snippets
1. The script creates a panel containing the GUI and an iframe.
2. The iframe's source is set to a data URL with type "text/html" and the entire contents of the relevant code block.

I got lazy and solved some things the easy way, which may not be the most efficient way. It's not too bad I guess, but feel free to look at the code and suggest improvements.
