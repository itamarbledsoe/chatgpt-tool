// ==UserScript==
// @name         ChatGPT Tool
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Add button to download current chat, including branches. Add buttons to embed code snippets in floating frames.
// @author       ittixen
// @match        https://chat.openai.com/chat
// @match        https://chat.openai.com/chat/*
// @icon         https://chat.openai.com/favicon-32x32.png
// @grant        none
// ==/UserScript==

(function() {
 
 ini_style();
 const re = iniRE();
 const TYPES = ini_types();
 const SVG = ini_svg();
 const injectors = ini_injections();
 let el_main;
 let el_downloader, el_button_download_chat; create_chat_download_button();
 let fetch_current_conversation;
 let selecting;
 ini_selecting();
 intercept_fetch();
 next_panel.x = 0, next_panel.y = 0, next_panel.z = 1, next_panel.offset = 60;
 window.cgptt = {
  download_chat ,
  embed_code ,
  create_panel ,
  populate_code_buttons ,
 };
 
 
 // ACTIONS
 
 async function download_chat() {
  el_button_download_chat.classList.add('cgptt-downloading');
  el_button_download_chat.disabled = true;
  const response = await fetch_current_conversation();
  const s_content_type = [...response.headers.entries()].find( ([k,v])=>k.match(/content-type/i) )?.[1].split(';').type;
  let s_content = await response.text();
  if ( s_content_type.match(/json/i) ) {
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
  update_download_link( s_content , s_content_type );
  el_downloader.click();
  el_button_download_chat.classList.remove('cgptt-downloading');
  el_button_download_chat.disabled = false;
 }
 
 async function download_code( el_download_button , s_code , s_content_type ) {
  el_download_button.classList.add('cgptt-downloading');
  el_download_button.disabled = true;
  update_download_link( s_code , s_content_type );
  el_downloader.click();
  el_download_button.classList.remove('cgptt-downloading');
  el_download_button.disabled = false;
 }
 
 function get_data_uri( s , type=TYPES.DEFAULT.content_type ) {
  if (type==TYPES.svg) type = TYPES.html;
  return `data:${type},`+encodeURIComponent(s);
 }
 
 // BUTTONS
 
 function create_chat_download_button() {
  // The link that actually downloads the compiled file
  el_downloader = document.createElement('a');
  el_downloader.classList.add('cgptt-downloader');
  // The button that initiates fetching and compiling the data
  el_button_download_chat = document.createElement('button');
  el_button_download_chat.classList.add('cgptt-download-button');
  el_button_download_chat.textContent = 'Download Chat';
  el_button_download_chat.addEventListener( 'click' , download_chat );
  document.body.appendChild(el_downloader);
  document.body.appendChild(el_button_download_chat);
 }
 
 function update_download_link( s_data , s_content_type , s_extension ) {
  s_content_type ??= TYPES[ s_extension ??= TYPES.DEFAULT.extension ];
  s_extension ??= TYPES[ s_content_type ??= TYPES.DEFAULT.content_type ];
  el_downloader.href = get_data_uri( s_data , s_content_type );
  el_downloader.setAttribute( 'download' , `cgpt_${get_timestamp()}_${document.title.replace(re.filename,'_')}.`+s_extension );
 }
 
 function repeat_populate_code_buttons() {
  if (repeat_populate_code_buttons.toid) clearTimeout( repeat_populate_code_buttons.toid );
  if (repeat_populate_code_buttons.retry--) populate_code_buttons();
  if (repeat_populate_code_buttons.retry <= 0) return;
  repeat_populate_code_buttons.toid = setTimeout( repeat_populate_code_buttons , 1000 );
 }
 
 function populate_code_buttons(evt) {
  const is_different_conversation_loaded = ( el_main !== ( el_main = document.querySelector('#__next main') || el_main ) );
  if (is_different_conversation_loaded) {
   repeat_populate_code_buttons.retry = 0;
  }
  [...document.querySelectorAll('.markdown > pre')]
  .forEach( (el_code_block,i)=>{
   if ( el_code_block.classList.contains('cgptt-code-block') ) return;
   const el_buttons = el_code_block.firstElementChild.firstElementChild;
   const el_code    = el_code_block.querySelector('code');
   const el_button_original = el_buttons.firstElementChild;
   const s_language = el_code.className.match(re.class_language)?.[1];
   let s_content_type = s_language && 'text/'+s_language;
   if (!TYPES[s_content_type]) s_content_type = TYPES.DEFAULT.content_type;
   const buttons = [ el_button_original ];
   imitate_button( embed );
   imitate_button( download );
   buttons.forEach( el_button=>{ el_button.classList.add('cgptt-code-block-button') } );
   el_code_block.classList.add('cgptt-code-block');
   function embed(){ embed_code( el_code.textContent , s_content_type ) }
   function download(){ download_code( buttons.download , el_code.textContent.replace( re.trim_whitespace , '' ) , s_content_type ) }
   function imitate_button( action , name , svg , text ) {
    name ??= action.name;
    svg ??= SVG[name];
    text ??= name.replace( re.initials , re._initials_ );
    const el_button = el_button_original.cloneNode();
    buttons.unshift( buttons[name] = el_button );
    el_button.addEventListener( 'click' , action );
    const el_svg = el_button_original.firstElementChild.cloneNode();
    el_svg.innerHTML = svg;
    el_button.appendChild(el_svg);
    el_button.append(text);
    el_buttons.insertBefore( el_button , el_button_original );
   }
  });
 }
 
 // PANELS
 
 function embed_code( s_code , s_content_type , el_parent=document.body ) {
  let s_extension, as_html;
  let injector;
  const panel = create_panel(el_parent);
  const {buttons} = panel;
  Object.defineProperties( panel , {
   s_code         : { get:()=>s_code         } ,
   s_content_type : { get:()=>s_content_type } ,
   s_extension    : { get:()=>s_extension    } ,
  });
  Object.assign( panel , {
   set_code ,
  });
  const el_iframe = document.createElement('iframe');
  el_iframe.tabIndex = -1;
  const el_editor = document.createElement('textarea');
  el_editor.addEventListener( 'keydown' , evt=>{
   if ( evt.ctrlKey && evt.keyCode==13 ) return set_code();
   if ( evt.keyCode==27 ) toggle_editing();
  });
  el_editor.spellcheck = false;
  set_code(s_code);
  set_type();
  panel.add_content(el_iframe);
  panel.add_content(el_editor);
  panel.add_button( start_editing_type , 'type' , '' , 'input' );
  panel.add_button( toggle_editing     , 'edit' );
  panel.add_button( toggle_dark        , 'dark' );
  panel.add_button( clone );
  panel.add_button( inject );
  panel.el.addEventListener( 'mousedown' , evt=>{
   if ( as_html && evt.buttons===1 ) selecting?.( panel );
  });
  buttons.type.spellcheck = false;
  buttons.type.addEventListener( 'focus' , start_editing_type );
  buttons.type.addEventListener( 'blur' , exit_editing_type );
  buttons.type.addEventListener( 'blur' , exit_editing_type );
  buttons.type.addEventListener( 'keydown' , evt=>{
   if (evt.keyCode==13) return confirm_editing_type();
   if (evt.keyCode==27) return exit_editing_type();
  });
  exit_editing_type();
  toggle_dark();
  return panel;
  function set_code( s=el_editor.value ) {
   s_code = s;
   el_editor.value = s_code;
   el_iframe.setAttribute( 'src' , get_data_uri(s_code,s_content_type) );
  }
  function start_editing_type() {
   buttons.type.focus();
   buttons.type.select();
  }
  function confirm_editing_type() {
   set_type( buttons.type.value );
   exit_editing_type();
  }
  function exit_editing_type() {
   buttons.type.blur();
   buttons.type.value = s_content_type;
  }
  function is_editing_type() {
   return buttons.type == document.activeElement;
  }
  function set_type( ...hints ) {
   hints = hints.filter(Boolean);
   if (!hints.length) hints.push( s_code , s_content_type , s_extension );
   const entry = TYPES.guess(...hints);
   // if ( entry.content_type == s_content_type ) return;
   panel.el.classList.remove('cgptt-panel-'+s_extension);
   [ s_content_type , s_extension ] = entry;
   as_html = s_extension=='html' || s_extension=='svg';
   injector = injectors(panel);
   set_code();
   panel.el.classList.toggle( 'cgptt-panel-html' , as_html );
   panel.el.classList.toggle( 'cgptt-injectable' , !!injector );
   panel.el.classList.add('cgptt-panel-'+s_extension);
   if (buttons.type) buttons.type.value = entry.type;
  }
  function toggle_editing() {
   if (panel.el.classList.toggle('cgptt-editing')) el_editor.focus();
   else set_code();
  }
  function toggle_dark() {
   const flag = !panel.el.classList.contains('cgptt-dark');
   panel.el.classList.toggle( 'cgptt-dark' , flag );
   if (as_html) {
    set_code();
    set_code( s_code.split(injectors._dark_).join('') );
    if (flag) injectors._dark_(panel);
   }
  }
  function clone() {
   embed_code( s_code , s_content_type , el_parent );
  }
  function inject() {
   if (injector) {
    if ( injector.prompt && !injector.prompt() ) return;
    select_panel().then( other_panel=>other_panel&&injector(other_panel) ).catch( console.warn );
   }
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
  el_panel.appendChild(el_bar);
  const buttons = [];
  add_button( toggle_minimize , 'mini'  , '-' );
  add_button( close           , 'close' , '×' );
  const el_content = document.createElement('div');
  el_content.classList.add('cgptt-content');
  el_panel.appendChild(el_content);
  const el_overlay = document.createElement('div'); // To not lose mouse events in iframe when moving
  el_overlay.classList.add('cgptt-overlay');
  el_panel.appendChild(el_overlay);
  contents.forEach( add_content );
  ini_position();
  addEventListener( 'resize' , delay_contain );
  addEventListener( 'mousemove' , move );
  addEventListener( 'mouseup' , stop_moving );
  el_panel.addEventListener( 'mousedown' , to_front );
  return {
   el : el_panel ,
   buttons ,
   get x(){ return x } ,
   get y(){ return y } ,
   close ,
   move_to ,
   to_front ,
   add_content ,
   add_button ,
   ini_position ,
  };
  //
  function add_content(el) {
   el_content.appendChild(el);
  }
  function add_button( action , name=action.name , text=name.replace( re.initials , re._initials_ ) , tag='button' ) {
   const el_button = document.createElement(tag);
   el_button.textContent = text;
   el_button.classList.add('cgptt-bar-button');
   el_button.classList.add('cgptt-bar-button-'+name);
   el_button.addEventListener( 'focus' , to_front );
   if (action) el_button.addEventListener( 'click' , action );
   else el_button.disabled = true;
   el_bar.insertBefore( el_button , buttons.close );
   buttons.push(buttons[name]=el_button);
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
  function move_to( toX=x , toY=y ) {
   el_panel.style.left = (x=Math.max(toX,0))+'px';
   el_panel.style.top  = (y=Math.max(toY,0))+'px';
  }
  function delay_contain() {
   if (delay_contain.toid) delay_contain.toid = clearTimeout(delay_contain.toid);
   delay_contain.toid = setTimeout( move_to , 1000 );
  }
  function start_moving(evt) {
   if (evt.target != el_bar) return;
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
 
 function select_panel() {
  return new Promise( (succ,fail)=>{
   try {
    document.body.classList.add('cgptt-selecting');
    selecting = panel=>{
     document.body.classList.remove('cgptt-selecting');
     succ(panel);
    };
   } catch(err) {
    fail(err);
   }
  });
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
 
 function intercept( object , key , mitm , value , get , set ) {
  const original = object[key];
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
  Object.defineProperty( object , key , definition );
 }
 
 // INI
 
 function intercept_fetch() {
  intercept( window , 'fetch' , save_fetch_parameters );
  function save_fetch_parameters( target , url , ...rest ) {
   if ( url.includes('backend-api/conversation/') || !fetch_current_conversation ) {
    fetch_current_conversation = function() {
     return fetch( url , ...rest );
    };
    repeat_populate_code_buttons.retry = 30;
    repeat_populate_code_buttons();
   }
  }
 }
 
 function iniRE() {
  return {
   initials : /(?<=^|_)[a-z]/g , _initials_ : c=>c.toUpperCase() ,
   filename : /[^_a-z0-9,.]/gi ,
   class_language : /language-(\S+)/ ,
   trim_whitespace : /(^\s*\n)|(\n\s*$)/gm ,
  };
 }
 
 function ini_injections() {
  const definitions = {
   css  : [ /(?=<\/head>|$)/i , s_code=>`<style>\n${s_code}\n</style>`   ] ,
   js   : [ /(?=<\/body>|$)/i , s_code=>`<script>\n${s_code}\n</script>` ] ,
   svg  : [ /(?=<\/body>|$)/i , s_code=>s_code                           ] ,
   get html(){ return definitions.svg } ,
  };
  get._dark_ = get_baked( 'css' , 'body{background:#000;color:#fff;}' );
  return get;
  function get( panel ) {
   const definition = definitions[panel.s_extension];
   if (definition) {
    const [ where , wrap ] = definition;
    inject.wrap = wrap;
    return inject;
    function inject(other_panel) {
     other_panel.set_code( other_panel.s_code.replace( where , wrap(panel.s_code) ) );
    }
   }
  }
  function get_baked( s_extension , s_code ) {
   const injector = get({s_extension,s_code});
   const wrapped = injector.wrap(s_code);
   injector.toString = ()=>wrapped;
   return injector;
  }
 }
 
 function ini_selecting() {
  addEventListener( 'keydown' , evt=>evt.keyCode==27&&selecting?.() );
  addEventListener( 'mouseup' , evt=>evt.button===0&&selecting?.() );
 }
 
 function ini_types() {
  const content_types = [];
  const extensions = [];
  const entries = [
   [ 'text/plain'      , 'txt'  ] ,
   [ 'text/css'        , 'css'  ] ,
   [ 'text/json'       , 'json' ] ,
   [ 'text/javascript' , 'js'   ] ,
   [ 'text/html'       , 'html' ] ,
   [ 'text/xml'        , 'xml'  ] ,
   [ 'image/xml+svg'   , 'svg'  , /^\s*<svg.*<\/svg>\s*$/is ] ,
  ];
  const TYPES = [];
  entries.forEach( (entry,i_entry)=>{
   const [content_type,extension,matcher] = entry;
   TYPES[i_entry]      = entries[content_type] = entries      [extension]    = entry;
   TYPES[extension]    = entry  [extension]    = content_types[extension]    = content_type;
   TYPES[content_type] = entry  [content_type] = extensions   [content_type] = extension;
   Object.assign( entry , { extension , content_type , matcher } );
  });
  const DEFAULT = entries.html;
  return Object.assign( TYPES , { DEFAULT , entries , content_types , extensions , guess } );
  function guess(...hints) {
   let result;
   hints.some( hint=>{
    if (entries.includes(hint)) return hint;
    hint = String(hint).toLowerCase();
    result = entries.find( entry=>{
     return (
      entry.content_type == hint ||
      entry.content_type.split('/').pop() == hint ||
      entry.extension == hint ||
      entry.matcher?.test(hint)
     );
    });
    return result;
   });
   return result;
  }
 }
 
 function ini_svg() {
  return {
   embed:
    `M4 6L4 4L6 4M10 4L14 4M18 4L20 4L20 6M20 10L20 14M20 18L20 20L18 20M14 20L10 20M6 20L4 20L4 18M4 14L4 10`
    .replace( /M[^M]+/g , d=>`<path stroke="currentColor" fill="none" d="${d}"></path>` )+
    `<path stroke="none" fill="currentColor" d="M9 7L16 12L9 17"></path>` ,
   download:
    `<path stroke="currentColor" fill="none" d="M4 14L4 20L20 20L20 14"></path>
     <path stroke="none" fill="currentColor" d="M7 7L12 16L17 7"></path>` ,
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
    --pad-bar-button: 6px 12px;
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
    --color-ol: #000;
    --color-fg: #fff;
    --color-bg: #333;
    --color-bg-hl: #222;
    --color-bg-active: #444;
    padding: var(--pad-bar-button) !important;
    border-radius: var(--px-row);
    cursor: pointer;
    text-align: center;
    color: var(--color-fg);
    outline-color: var(--color-ol);
    outline-width: 2px;
    outline-style: none;
    outline-offset: 2px;
    background: var(--color-bg);
   }
   .cgptt-download-button:hover ,
   .cgptt-panel > .cgptt-bar > .cgptt-bar-button:hover {
    background: var(--color-bg-hl);
   }
   .cgptt-panel > .cgptt-bar > .cgptt-bar-button:focus {
    outline-style: solid;
    background: var(--color-bg-hl);
   }
   .cgptt-panel > .cgptt-bar > .cgptt-bar-button:active {
    background: var(--color-bg-active);
   }
   
   /* CODE BLOCKS */
   
   .cgptt-code-block .cgptt-code-block-button {
    margin: auto !important;
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
    --color-bg: #666;
    --color-bg-editing: #008;
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
    background: var(--color-bg) !important;
    outline: 2px solid #888 !important;
   }
   .cgptt-panel.cgptt-editing {
    background: var(--color-bg-editing) !important;
   }
   .cgptt-panel.cgptt-dark {
    --color-bg: #222;
    --color-bg-editing: #004;
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
   
   /* PANEL BAR BUTTONS */
   
   .cgptt-panel > .cgptt-bar > .cgptt-bar-button {
    min-height: var(--px-row);
    min-width: var(--px-row);
    margin-right: var(--gap) !important;
   }
   .cgptt-panel > .cgptt-bar > .cgptt-bar-button[disabled] {
    --color-fg: #aaa;
    --color-bg: #444;
    --color-bg-hl: #fff;
    --color-bg-active: #444;
    cursor: default !important;
   }
   .cgptt-panel.cgptt-dark > .cgptt-bar > .cgptt-bar-button {
    --color-ol: #000;
    --color-fg: #fff;
    --color-bg: #444;
    --color-bg-hl: #555;
    --color-bg-active: #333;
   }
   
   /* BUTTON: TYPE */
   
   .cgptt-panel > .cgptt-bar > .cgptt-bar-button-type {
    --color-bg-hl: #000 !important;
    --color-bg-active: #000 !important;
    width: 140px;
   }
   .cgptt-panel > .cgptt-bar > .cgptt-bar-button-type:focus {
    cursor: text;
   }
   
   /* BUTTON: INJECT */
   
   .cgptt-panel > .cgptt-bar > .cgptt-bar-button-inject {
    display: none;
   }
   .cgptt-injectable > .cgptt-bar > .cgptt-bar-button-inject {
    display: unset;
   }
   
   /* BUTTON: CLOSE */
   
   .cgptt-panel > .cgptt-bar > .cgptt-bar-button-close {
    --color-ol: #f00 !important;
    --color-fg: #fff !important;
    --color-bg: #c00 !important;
    --color-bg-hl: #f00 !important;
    --color-bg-active: #f00 !important;
    position: absolute;
    right: var(--gap);
   }
   
   /* PANEL CONTENT */
   
   .cgptt-panel > .cgptt-content {
    display: grid;
    overflow: hidden;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
    gap: var(--gap);
    padding: var(--gap);
    grid-row: 2;
    grid-column: 1;
    background: none !important;
   }
   
   .cgptt-panel > .cgptt-content > * {
    width: 100%;
    grid-column: 1;
    border: none;
   }
   /* CODE EDITOR */
   .cgptt-panel.cgptt-editing > .cgptt-content {
    grid-template-rows: 1fr 1fr;
   }
   .cgptt-panel > .cgptt-content > textarea {
    display: none;
    padding: 6px 8px !important;
    box-sizing: border-box;
    resize: none;
    color: #fff;
    background: #222 !important;
   }
   /* DISPLAY */
   .cgptt-panel > .cgptt-content > iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: #fff !important;
   }
   
   /* PANEL DARK */
   .cgptt-panel.cgptt-dark > .cgptt-content > iframe {
    filter: invert(1);
   }
   .cgptt-panel-html.cgptt-dark > .cgptt-content > iframe {
    filter: none;
   }
   .cgptt-panel.cgptt-editing > .cgptt-content > textarea {
    display: block;
   }
   .cgptt-panel.cgptt-editing > .cgptt-content > textarea:focus {
    background: #000 !important;
    outline: 1px solid #888 !important;
    outline-offset: -1px;
    border: none !important;
    box-shadow: none !important;
   }
   
   /* PANEL MANIPULATION */
   
   .cgptt-panel > .cgptt-overlay {
    width: 0%;
    height: 0%;
    opacity: 0;
    z-index: 999;
    grid-row: 1/3;
    grid-column: 1;
    background: #0000;
   }
   body.cgptt-moving    .cgptt-panel > .cgptt-overlay ,
   body.cgptt-selecting .cgptt-panel > .cgptt-overlay {
    width: auto;
    height: auto;
    opacity: 1;
   }
   body.cgptt-moving    .cgptt-panel > .cgptt-overlay {
    /*background: #00f2;*/
   }
   body.cgptt-selecting .cgptt-panel > .cgptt-overlay {
    background: #000c !important;
   }
   body.cgptt-selecting .cgptt-panel-html > .cgptt-overlay {
    background: #0000 !important;
   }
   body.cgptt-selecting .cgptt-panel-html:hover > .cgptt-overlay {
    background: #0808 !important;
   }
   
   body.cgptt-selecting .cgptt-panel ,
   body.cgptt-selecting .cgptt-panel * {
    cursor: not-allowed !important;
   }
   body.cgptt-selecting .cgptt-panel-html ,
   body.cgptt-selecting .cgptt-panel-html * {
    cursor: crosshair !important;
   }
   body.cgptt-selecting .cgptt-panel-html:hover {
    z-index: 999 !important;
    outline: 4px solid #0808 !important;
    outline-offset: 4px;
    background: #040 !important;
   }
   
   .cgptt-panel.cgptt-minimized > .cgptt-content,
   .cgptt-panel.cgptt-minimized > .cgptt-overlay {
    display: none;
   }
   
  `;
  document.head.appendChild(style);
 }
 
})();
