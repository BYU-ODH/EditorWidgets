var EditorWidgets
(function(EditorWidgets){
	var dialogTemplate = getRootElement(
		'<div style="position:fixed;display:inline-block;border-radius:5px;background-color:#eeeeee;padding:0 5px 5px 5px;">\
			<div data-template-key="dialog_bar" style="padding:0 -1px;">\
				<span data-template-key="dialog_title"></span>\
				<span class="close" data-template-key="close_btn">&times;</span>\
		</div></div>');
	
	function getRootElement(t){
		var root;
		if(typeof t === 'string'){
			root = document.createElement('span');
			root.innerHTML = t;
		}else{ root = t.cloneNode(true); }
		return (root.childNodes.length === 1)?root.firstChild:root;
	}
	
	function processTemplate(template, config){
		var nodes = [], attrs = {}, events,
			root = getRootElement(template),
			elements = config.elements||{},
			rconf = config.root||{};
		[].forEach.call(root.querySelectorAll('[data-template-key]'),function(n){
			var econf, key = n.getAttribute('data-template-key');
			attrs[key] = n;
			if(!elements.hasOwnProperty(key)){ return; }
			econf = elements[key];
			if(typeof econf.init === 'function'){ econf.init.call(n,root); }
			if(econf.hasOwnProperty('events')){
				events = econf.events;
				Object.keys(events).forEach(function(event){
					n.addEventListener(event,events[event],false);
				});
			}
		});
		if(typeof rconf.finalize === 'function'){ rconf.finalize(root, attrs); }
		if(rconf.hasOwnProperty('events')){
			events = rconf.events;
			Object.keys(events).forEach(function(event){
				root.addEventListener(event,events[event],false);
			});
		}
		return root;
	}
	
	processTemplate.Dialog = function(title, template, config){
		var dialog, wrapper, events,
			rconf = config.root||{},
			parent = config.parent||document.body,
			style = config.style;
		
		dialog = processTemplate(dialogTemplate,{
			elements: {
				dialog_bar: {
					init: function(root){ EditorWidgets.Dragable && (new EditorWidgets.Dragable(root,this,config)); }
				},
				dialog_title: {
					init: function(root){ this.innerHTML = title; }
				},
				close_btn: {
					events: { click: function(){ wrapper.close(); } }
				},
			}
		});
				
		if(typeof style === 'object'){
			Object.keys(style).forEach(function(pname){
				dialog.style[pname] = style[pname];
			});
		}
		if(rconf.hasOwnProperty('events')){
			events = rconf.events;
			Object.keys(events).forEach(function(event){
				dialog.addEventListener(event,events[event],false);
			});
		}
		
		processTemplate(template, {
			root: {
				finalize: function(root,attrs){
					dialog.appendChild(root);
					if(typeof rconf.finalize === 'function'){ rconf.finalize(dialog,attrs); }
				}
			},
			elements:config.elements
		});
		
		if(!dialog.style.top){ dialog.style.top = (Math.random()*50+10)+"%"; }
		if(!dialog.style.left){ dialog.style.left = (Math.random()*50+10)+"%"; }
		
		if(config.autoshow){ parent.appendChild(dialog); }
		
		return (wrapper = {
			dialog: dialog,
			show: function(){ if(dialog.parentNode !== parent){ parent.appendChild(dialog); } },
			close: function(){
				if(!dialog.parentNode){ return; }
				dialog.parentNode.removeChild(dialog);
				if(this.onClose){ this.onClose(); }
			}
		});
	};
	
	EditorWidgets.Template = processTemplate;
})(EditorWidgets || (EditorWidgets = {}));