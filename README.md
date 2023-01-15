# chatgpt-tool
A userscript for ChatGPT which adds:
1. A button to download current chat, including branches.
2. Buttons to embed code snippets in floating frames.

Feel free to examine the source code and suggest improvements.

Instructions:

1. Installation
1.1. Install a browser extension for userscripts. I use Tampermonkey: https://www.tampermonkey.net/
1.2. Create a new empty userscript with your choice of userscript manager.
1.3. Make sure to delete everything in the new userscript.
1.4. Copy the code from the file "cgptt.js" into your empty userscript.

2. Usage
2.1. Downloading a Chat
2.1.1. When the page loads, the script should automatically add a "Download Chat" button on the top.
2.1.2. When you open a different chat, the button takes a moment to update.
2.1.3. After it's loaded, click the button to download a JSON file containing all the data of the current chat (much more than visible on the screen btw).
2.2. Embedding Code Snippets
2.2.1. When the page loads, the script should automatically add "Embed" buttons to code snippets in the chat.
2.2.2. Clicking an "Embed" button will create a floating frame running the code from the code block. It is treated as HTML.
2.2.3. You can close the floating frame, resize it, minimize it, or modify its code by clicking "Edit".
2.2.4. The frame will update when you click the "Edit" button again to close the editor, or when you press Ctrl+Enter.
2.2.5. I added another button for quickly adding/removing a style of white text on black background to the code. Was useful to me when working with SVGs.

3. How it Works
3.1. Downloading a Chat
3.1.1. The script intercepts network requests in the page and copies the relevant parameters for reuse when downloading.
3.1.2. When clicking the button, it fetches the data, then updates a dedicated invisible link with a data URL, then fakes a click on it.
3.2. Embedding Code Snippets
3.2.1. The script creates a panel containing the GUI and an iframe.
3.2.2. The iframe's source is set to a data URL with type "text/html" and the entire contents of the relevant code block.

I got lazy and solved some things the easy way, which may not be the most efficient way. It's not too bad I guess, but feel free to look at the code and suggest improvements.
