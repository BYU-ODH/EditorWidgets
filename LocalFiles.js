var EditorWidgets
(function(EditorWidgets){
	var Save = EditorWidgets.Save,
		fileDialogTemplate = '<div style="position:fixed;display:inline-block;border-radius:5px;background-color:#eeeeee;padding-bottom:5px;">\
					<div data-template-key="dialog_bar" style="padding:0 4px;margin: 1px 1px 1px 16px;cursor:move;">\
						Choose File <button class="close" data-template-key="close_btn">&times;</button><br/>\
					</div><input type="file" data-template-key="filepicker" /></div>',
		storageDialogTemplate = '<div style="position:fixed;display:inline-block;border-radius:5px;background-color:#eeeeee;padding-bottom:5px;">\
					<div data-template-key="dialog_bar" style="padding:0 4px;margin: 1px 1px 1px 16px;cursor:move;">\
						Choose File <button class="close" data-template-key="close_btn">&times;</button><br/>\
					</div><div data-template-key="filelist" style="padding:0 20px 20px 20px;min-width:150px;max-height: 150px;overflow: auto;"></div></div>';
	
	function processTemplate(template, config, cb){
		var nodes = [], n, root, key, attrs = {};
		if(typeof template === 'string'){
			root = document.createElement('span');
			root.innerHTML = template;
		}else{ root = template.cloneNode(true); }
		if(root.children.length === 1){ root = root.firstChild; }
		n = root;
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

	function saveFile(fdata){
		var link = document.createElement('a');
		link.target = "_blank";
		fdata.forEach(function(fobj){
			var evt = document.createEvent("HTMLEvents");
			evt.initEvent("click");
			link.download = fobj.name;
			link.href = "data:"+fobj.mime+";charset=UTF-8,"+encodeURIComponent(fobj.data);
			link.dispatchEvent(evt);
		});
	}
	saveFile.name = "Save to File";
	
	function saveStorage(fdata){
		fdata.forEach(function(fobj){ localStorage["file:"+fobj.name] = JSON.stringify(fobj); });
	}
	saveStorage.name = "Save to Browser Storage";
	
	function fileDialog(exp,cb){ //show file picker dialog
		return processTemplate(fileDialogTemplate,{
			dialog_bar: function(root){ window.Dragable && (new window.Dragable(root,this)); },
			close_btn: function(root){
				this.addEventListener('click',function(){
					root.parentNode.removeChild(root);
				},false);
			},
			filepicker: function(root){
				this.addEventListener('change',function(evt){
					var file = evt.target.files[0],
						reader = new FileReader();
					reader.onload = function(evt){
						root.parentNode.removeChild(root);
						cb({
							name: file.name,
							mime: file.type,
							data: evt.target.result
						});
					};
					reader.onerror = function(e){alert("Error Reading File:\n" + e.message);};
					reader.readAsText(file);
				});
			}
		});
	}
	
	function storageDialog(exp,cb){ //show storage key picker dialog
		return processTemplate(storageDialogTemplate,{
			dialog_bar: function(root){ window.Dragable && (new window.Dragable(root,this)); },
			close_btn: function(root){
				this.addEventListener('click',function(){
					root.parentNode.removeChild(root);
				},false);
			},
			filelist: function(root){
				var i, key, a;
				for(i = 0;key=localStorage.key(i);i++){
					if(key.substr(0,5) === 'file:' && exp.test(key)){
						a = document.createElement('a');
						a.style.display = "block";
						a.href = "#";
						a['data-key'] = key
						a.innerText = key.substr(5);
						a.addEventListener('click',function(){
							root.parentNode.removeChild(root);
							cb(JSON.parse(localStorage[this['data-key']]));
						});
						this.appendChild(a);
					}
				}
			}
		});
	}
	
	function LocalFile(loc,exp,cb){
		var dialog = (LocalFile.dialogs.hasOwnProperty(loc)?LocalFile.dialogs[loc]:fileDialog)(exp,cb);
		dialog.style.top = (Math.random()*50+10)+"%";
		dialog.style.left = (Math.random()*50+10)+"%";
		document.body.appendChild(dialog);
	}
	LocalFile.dialogs = {storage: storageDialog };
	
	if(Save){
		Save.targets.file = saveFile;
		Save.targets.storage = saveStorage;
	};

	EditorWidgets.LocalFile = LocalFile;
})(EditorWidgets || {});