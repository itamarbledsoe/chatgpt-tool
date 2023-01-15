// ==UserScript==
// @name         ChatGPT Tool
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add button to download current chat, including branches. Add buttons to embed code snippets in floating frames.
// @author       ittixen
// @match        http://*.example.com/*
// @match        https://chat.openai.com/chat
// @match        https://chat.openai.com/chat/*
// @icon         https://chat.openai.com/favicon-32x32.png
// @grant        none
// ==/UserScript==

(function() {
 
 const SVG = ini_svg();
 ini_style();
 let el_downloader, el_download_button;
 create_download_button();
 let fetch_current_conversation;
 populate_code_buttons();
 intercept_fetch();
 next_panel.x = 0, next_panel.y = 0, next_panel.z = 1, next_panel.offset = 20;
 addEventListener( 'mousedown' , populate_code_buttons );
 addEventListener( 'touchstart' , populate_code_buttons );
 addEventListener( 'wheel' , populate_code_buttons );
 setInterval( populate_code_buttons , 3000 );
 window.cgptt = {
  download_chat ,
  embed_code ,
  create_panel ,
  populate_code_buttons ,
 };
 // test();
 
 function test() {
  fetch(location.href);
  add_random();
  addEventListener( 'click' , add_random );
  function add_random(evt) {
   console.log( evt , evt?.target.closest('.cgptt-panel') );
   if ( evt && evt?.target.closest('.cgptt-panel') ) return;
   if ( Math.random() > .5 ) {
    const el_p = document.createElement('p');
    el_p.innerText = "Hello World\nWhat's up fellas and broads.";
    const panel = create_panel(el_p);
   } else {
    embed_code('<p>Yo yo yo, missa onna mic!<br>Wassa gonna bike?</p><a href="http://example.com">example</a>');
   }
  }
 }
 
 // ACTIONS
 
 async function download_chat() {
  el_download_button.classList.add('cgptt-downloading');
  el_download_button.disabled = true;
  const response = await fetch_current_conversation();
  const s_type = [...response.headers.entries()].find( ([k,v])=>k.match(/content-type/i) )?.[1].split(';')[0];
  let s_content = await response.text();
  if ( s_type.match(/json/i) ) {
   try {
    console.log('Indenting JSON...');
    const o_json = JSON.parse(s_content);
    const s_json = JSON.stringify( o_json , null , '  ' );
    s_content = s_json;
   } catch (err) {
    console.log('Error indenting JSON.');
    console.log(err);
   }
  }
  update_download_link( s_content , s_type );
  el_downloader.click();
  el_download_button.classList.remove('cgptt-downloading');
  el_download_button.disabled = false;
 }
 
 function get_data_uri( s , type='text/plain' ) {
  return `data:${type},`+encodeURIComponent(s);
 }
 
 // BUTTONS
 
 function create_download_button() {
  // The link that actually downloads the compiled file
  el_downloader = document.createElement('a');
  el_downloader.classList.add('cgptt-downloader');
  // The button that initiates fetching and compiling the data
  el_download_button = document.createElement('button');
  el_download_button.classList.add('cgptt-download-button');
  el_download_button.textContent = 'Download Chat';
  el_download_button.addEventListener( 'click' , download_chat );
  document.body.appendChild(el_downloader);
  document.body.appendChild(el_download_button);
 }
 
 function update_download_link( s_data , s_type , s_ext = s_type?.split('/')[1]?.replace(/plain/i,'')||'txt' ) {
  el_downloader.href = get_data_uri( s_data , s_type );
  el_downloader.setAttribute( 'download' , `cgpt_${get_timestamp()}_${document.title.replace(/[^_a-z0-9,.]/gi,'_')}.`+s_ext );
 }
 
 function populate_code_buttons() {
  [...document.querySelectorAll('.markdown > pre button')].forEach( el_button_original=>{
   const el_parent = el_button_original.parentNode;
   if ( !el_parent.classList.contains('cgptt') ) {
    if ( [...el_parent.children].some( el_button=>el_button.name=='embed' ) ) return;
    const el_svg = el_button_original.firstChild.cloneNode();
    el_svg.innerHTML = SVG.embed;
    const el_text = document.createElement('span');
    el_text.textContent = 'Embed';
    const el_button = el_button_original.cloneNode();
    el_button.addEventListener( 'click' , ()=>{
     const s_code = el_parent.nextElementSibling.textContent;
     embed_code(s_code);
    });
    el_button.appendChild(el_svg);
    el_button.appendChild(el_text);
    el_parent.insertBefore(el_button,el_button_original);
    el_parent.classList.add('cgptt');
   }
  });
 }
 
 // PANELS
 
 const s_dark_quickfix = '<style>body{background:#000;color:#fff;}</style>\n';
 function embed_code( s_code , el_parent=document.body ) {
  const panel = create_panel(el_parent);
  const el_iframe = document.createElement('iframe');
  const el_editor = document.createElement('textarea');
  el_editor.addEventListener( 'keydown' , evt=>{
   if ( evt.ctrlKey && evt.keyCode==13 ) return set_code();
   if ( evt.keyCode==27 ) toggle_editing();
  });
  el_editor.spellcheck = false;
  panel.add_content(el_iframe);
  panel.add_content(el_editor);
  panel.add_button( 'edit' , toggle_editing , 'Edit' );
  panel.add_button( 'dark' , toggle_dark , 'Dark Quickfix' );
  panel.set_code = set_code;
  set_code(s_code);
  return panel;
  function set_code( s=el_editor.value ) {
   s_code = s;
   el_editor.value = s_code;
   el_iframe.setAttribute( 'src' , get_data_uri(s_code,'text/html') );
  }
  function toggle_editing() {
   if (panel.el.classList.toggle('cgptt-editing')) {
    el_editor.focus();
   } else {
    set_code();
   }
  }
  function toggle_dark() {
   set_code();
   if (panel.el.classList.toggle('cgptt-dark')) s_code = s_dark_quickfix+s_code;
   else s_code = s_code.split(s_dark_quickfix).join('');
   set_code( s_code );
  }
 }
 
 function create_panel( el_parent , ...contents ) {
  let x, y, rect, offset;
  const el_panel = document.createElement('div');
  el_panel.classList.add('cgptt-panel');
  if (!el_parent.parentNode) contents.push(el_parent), el_parent = null;
  if (!el_parent) el_parent = document.body;
  el_parent.appendChild(el_panel);
  const el_bar = document.createElement('div');
  el_bar.classList.add('cgptt-bar');
  el_bar.addEventListener( 'mousedown' , start_moving );
  addEventListener( 'mousemove' , move );
  addEventListener( 'mouseup' , stop_moving );
  el_panel.appendChild(el_bar);
  add_button( 'mini' , toggle_minimize , '-' );
  add_button( 'close' , close , '×' );
  const el_content = document.createElement('div');
  el_content.classList.add('cgptt-content');
  el_panel.appendChild(el_content);
  const el_overlay = document.createElement('div'); // To not lose mouse events in iframe when moving
  el_overlay.classList.add('cgptt-overlay');
  el_panel.appendChild(el_overlay);
  contents.forEach( add_content );
  ini_position();
  return {
   el : el_panel ,
   get x(){ return x } ,
   get y(){ return y } ,
   close ,
   move_to ,
   add_content ,
   add_button ,
   ini_position ,
  };
  //
  function add_content(el) {
   el_content.appendChild(el);
  }
  function add_button( name , action , text='' ) {
   const el_button = document.createElement('button');
   el_button.textContent = text;
   el_button.classList.add('cgptt-bar-button');
   el_button.classList.add('cgptt-bar-button-'+name);
   el_button.addEventListener( 'click' , action );
   el_bar.appendChild(el_button);
  }
  function to_front() {
   el_panel.style.zIndex = next_panel.z++;
  }
  function close() {
   el_parent.removeChild(el_panel);
  }
  function toggle_minimize() {
   el_panel.classList.toggle('cgptt-minimized');
  }
  function move_to( toX , toY ) {
   el_panel.style.left = (x=toX)+'px';
   el_panel.style.top = (y=toY)+'px';
  }
  function start_moving(evt) {
   if (evt.target != el_bar) return;
   to_front();
   get_rect();
   offset = { x:evt.clientX-rect.x , y:evt.clientY-rect.y };
   document.body.classList.add('cgptt-moving');
  }
  function move(evt) {
   if (offset) {
    if (!evt.buttons) return stop_moving();
    move_to( evt.clientX-offset.x , evt.clientY-offset.y );
   }
  }
  function stop_moving() {
   offset = null;
   document.body.classList.remove('cgptt-moving');
  }
  function get_rect() {
   rect = el_panel.getBoundingClientRect();
  }
  function ini_position() {
   to_front();
   get_rect();
   next_panel( rect.width , rect.height );
   move_to( next_panel.x , next_panel.y );
  }
 }
 
 function next_panel( width , height ) {
  next_panel.x += next_panel.offset;
  next_panel.y += next_panel.offset;
  if ( next_panel.x && next_panel.x+width  > innerWidth  ) next_panel.x = 0;
  if ( next_panel.y && next_panel.y+height > innerHeight ) next_panel.y = 0;
 }
 
 // UTIL
 
 function get_timestamp( dt = new Date ) {
  return [
   [ dt.getFullYear() , 4 ] ,
   [ dt.getMonth()+1  , 2 ] ,
   [ dt.getDate()     , 2 ] ,
   [ dt.getHours()    , 2 ] ,
   [ dt.getMinutes()  , 2 ] ,
   [ dt.getSeconds()  , 2 ] ,
  ].map( ([n,p])=>String(n).padStart(p,'0') ).join('');
 }
 
 function intercept( target , key , mitm , value , get , set ) {
  const original = target[key];
  // console.log(`intercepting "${key}"`);
  if ( 'function' == typeof original ) {
   value ??= function (...args) {
    // console.log(key+'(',...args.map(v=>[',',v]).flat().slice(1),')');
    mitm(this,...args);
    return original.call(this,...args);
   };
  } else {
   return;
  }
  const definition = value ? {value} : {get,set};
  Object.defineProperty( target , key , definition );
 }
 
 // INI
 
 function intercept_fetch() {
  intercept( window , 'fetch' , save_fetch_parameters );
  function save_fetch_parameters( target , url , ...rest ) {
   if ( url.includes('backend-api/conversation/') || !fetch_current_conversation ) {
    fetch_current_conversation = function() {
     return fetch( url , ...rest );
    };
   }
  }
 }
 
 function ini_svg() {
  return {
   embed: `<rect x="4" y="4" width="16" height="16" rx="2" ry="2" stroke-dasharray="4,4" stroke="currentColor"></rect>
     <path stroke="none" fill="currentColor" d="M10 8L16 12L10 16"></path>`
  };
 }
 
 function ini_style() {
  const style = document.createElement('style');
  style.textContent = `
   
   /* GLOBAL */
   
   body {
    --px-row: 16px;
    --gap: 8px;
    --px-row2: calc( var(--px-row) * 2 + var(--gap) );
   }
   
   body.cgptt-moving, 
   body.cgptt-moving * {
    cursor: grabbing !important;
   }
   
   .cgptt-download-button ,
   .cgptt-panel ,
   .cgptt-panel * {
    margin: 0px !important;
    padding: 0px !important;
    border-radius: 0px;
    border: none;
    outline: none;
    user-select: none;
    font-size: 12px;
    font-family: monospace;
   }
   
   /* BUTTONS */
   
   .cgptt-download-button ,
   .cgptt-panel > .cgptt-bar > .cgptt-bar-button {
    padding: 6px 12px !important;
    border-radius: var(--px-row);
    cursor: pointer;
    color: #fff;
    background: #333;
   }
   .cgptt-download-button:hover ,
   .cgptt-panel > .cgptt-bar > .cgptt-bar-button:hover {
    background: #666 !important;
   }
   
   /* DOWNLOAD BUTTON */
   
   .cgptt-downloader { position:absolute; top:0px; right:0px; width:0px; height:0px; opacity:0; }
   .cgptt-download-button {
    position: fixed;
    top: 10px;
    right: 30px;
    background: #000;
    outline: 4px solid #aaa;
   }
   .cgptt-downloading {
    opacity: .2;
   }
   
   /* PANELS */
   
   .cgptt-panel {
    display: grid;
    grid-template-rows: auto 1fr;
    grid-template-columns: 1fr;
    padding: var(--gap) !important;
    gap: var(--gap);
    position: fixed;
    resize: both;
    overflow: hidden;
    min-width: 60px;
    min-height: 60px;
    background: #666 !important;
    outline: 1px solid #fff !important;
   }
   .cgptt-panel.cgptt-editing {
    background: #008 !important;
   }
   .cgptt-panel.cgptt-dark {
    background: #222 !important;
   }
   .cgptt-panel.cgptt-dark.cgptt-editing {
    background: #004 !important;
   }
   .cgptt-panel.cgptt-minimized {
    resize: none;
    height: unset !important;
   }
   
   .cgptt-panel > * {
    width: auto;
   }
   
   .cgptt-panel > .cgptt-bar {
    grid-row: 1;
    grid-column: 1;
    box-sizing: border-box;
    padding: var(--gap) !important;
    padding-right: var(--px-row2) !important;
    background: #ccc8;
    cursor: grab;
   }
   
   .cgptt-panel > .cgptt-bar > .cgptt-bar-button {
    min-height: var(--px-row);
    min-width: var(--px-row);
    margin-right: var(--gap) !important;
   }
   
   .cgptt-panel.cgptt-dark > .cgptt-bar > .cgptt-bar-button {
    outline: 1px solid #fff !important;
   }
   
   .cgptt-panel > .cgptt-bar > .cgptt-bar-button-close {
    position: absolute;
    right: var(--gap);
    background: #c00 !important;
   }
   .cgptt-panel > .cgptt-bar > .cgptt-bar-button-close:hover {
    background: #f00 !important;
   }
   
   .cgptt-panel.cgptt-minimized > .cgptt-content,
   .cgptt-panel.cgptt-minimized > .cgptt-overlay {
    display: none !important;
   }
   
   .cgptt-panel > .cgptt-content {
    display: grid;
    grid-templae-rows: auto;
    grid-templae-columns: 1fr 1fr;
    gap: var(--gap);
    grid-row: 2;
    grid-column: 1;
    background: inherit !important;
   }
   
   .cgptt-panel > .cgptt-content > * {
    width: 100%;
    grid-column: 1;
    color: #fff;
    background: #000 !important;
    border: none;
   }
   .cgptt-panel > .cgptt-content > textarea {
    display: none;
    resize: none;
    color: #fff;
    background: #000 !important;
   }
   .cgptt-panel > .cgptt-content > iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: none;
   }
   
   .cgptt-panel.cgptt-dark > .cgptt-content > * {
    background: #000 !important;
   }
   .cgptt-panel.cgptt-editing > .cgptt-content > textarea {
    display: block;
   }
   .cgptt-panel.cgptt-editing > .cgptt-content > textarea:focus {
    background: #222 !important;
   }
   
   .cgptt-panel > .cgptt-overlay {
    display: none;
    grid-row: 2;
    grid-column: 1;
    background: #0000 !important;
   }
   body.cgptt-moving .cgptt-panel > .cgptt-overlay {
    display: block;
   }
   
  `;
  document.head.appendChild(style);
 }
 
})();