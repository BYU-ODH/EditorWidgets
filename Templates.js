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
		return (root.children.length === 1)?root.firstChild:root;
	}
	
	function processTemplate(template, config, cb){
		var nodes = [], attrs = {}, n, root, key;
		n = root = getRootElement(template);
		do {
			if(n.nodeType === Node.ELEMENT_NODE){
				Array.prototype.push.apply(nodes,n.childNodes);
				key = n.getAttribute('data-template-key');
				if(key){
					config.hasOwnProperty(key) && config[key].call(n,root);
					attrs[key] = n;
				}
			}
		}while(n = nodes.pop());
		cb && cb(root, attrs);
		return root;
	}
	
	processTemplate.Dialog = function(title, template, config, cb){
		var dialog, wrapper, dt = dialogTemplate.cloneNode(true);
		dt.appendChild(getRootElement(template));
		
		if(!config.dialog_bar){
			config.dialog_bar = function(root){ EditorWidgets.Dragable && (new EditorWidgets.Dragable(root,this,config)); };
		}
		if(!config.dialog_title){
			config.dialog_title = function(root){ this.innerHTML = title; };
		}
		if(!config.close_btn){
			config.close_btn = function(root){
				this.addEventListener('click',function(){ wrapper.close(); },false);
			};
		}
		
		dialog = processTemplate(dt,config, cb);
		if(!dialog.style.top){ dialog.style.top = (Math.random()*50+10)+"%"; }
		if(!dialog.style.left){ dialog.style.left = (Math.random()*50+10)+"%"; }
		document.body.appendChild(dialog);
		return (wrapper = {
			dialog: dialog,
			close: function(){
				if(this.onBeforeClose){
					if(!this.onBeforeClose()){ return; }
				}
				if(dialog.parentNode){
					dialog.parentNode.removeChild(dialog);
					if(this.onClose){ this.onClose(); }
				}
			}, 
			show: function(){ document.body.appendChild(dialog); }
		});
	};
	
	EditorWidgets.Template = processTemplate;
})(EditorWidgets || (EditorWidgets = {}));