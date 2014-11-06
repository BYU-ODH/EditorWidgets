var EditorWidgets
(function(EditorWidgets){
	var Save = EditorWidgets.Save, saveFile,
		storageDialogTemplate = '<div data-template-key="filelist" style="padding:0 20px 20px 20px;min-width:150px;max-height: 150px;overflow: auto;"></div>';

	saveFile = (function(){
		var link = document.createElement('a');
		link.target = "_blank";
		return function(fdata,target,success,error){
			try{
				fdata.forEach(function(fobj){
					link.download = fobj.name;
					link.href = "data:"+fobj.mime+";charset=UTF-8,"+encodeURIComponent(fobj.data);
					link.dispatchEvent(new MouseEvent('click'));
				});
			}catch(e){
				if(typeof error === 'function'){ error(e); }
				return;
			}
			if(typeof success === 'function'){ success(fdata,target); }
		}
	}());
	saveFile.label = "Disk";

	function saveStorage(fdata,target,success,error){
		try{
			fdata.forEach(function(fobj){
				//reconstruct a new file object for safety,
				//to strip out any extra crud that might be there
				localStorage["file:"+fobj.name] = JSON.stringify({
					name: fobj.name,
					mime: fobj.mime,
					data: fobj.data
				});
			});
			if(typeof success === 'function'){ success(fdata,target); }
		}catch(e){
			if(typeof error === 'function'){ error(e); }
		}
	}
	saveStorage.label = "Browser Storage";

	function fileDialog(exp,success,error){ //show file picker dialog
		var f = document.createElement('input');
		f.type = "file";
		f.addEventListener('change',function(evt){
			var file = evt.target.files[0],
				reader = new FileReader();
			reader.onload = function(evt){
				success({
					name: file.name,
					mime: file.type,
					data: evt.target.result
				});
			};
			reader.onerror = error;
			reader.readAsText(file);
		});
		f.click();
	}
	fileDialog.label = "Disk";

	function storageDialog(exp,success,error){ //show storage key picker dialog
		EditorWidgets.Template.Dialog("Choose File", storageDialogTemplate,{
			filelist: function(root){
				var i, key, a;
				for(i = 0;key=localStorage.key(i);i++){
					if(key.substr(0,5) === 'file:' && exp.test(key)){
						a = document.createElement('a');
						a.style.display = "block";
						a.href = "#";
						a['data-key'] = key;
						a.textContent = key.substr(5);
						a.addEventListener('click',function(){
							var data;
							root.parentNode.removeChild(root);
							try {
								data = JSON.parse(localStorage[this['data-key']]);
							}catch(e){
								if(typeof error === 'function'){ error(e); }
								return;
							}
							success(data);
						});
						this.appendChild(a);
					}
				}
			}
		});
	}
	storageDialog.label = "Browser Storage";

	function LocalFile(loc,exp,success,error){ (LocalFile.sources.hasOwnProperty(loc)?LocalFile.sources[loc]:fileDialog)(exp,success,error); }
	LocalFile.sources = {
		file: fileDialog,
		storage: storageDialog
	};

	if(Save){
		Save.targets.file = saveFile;
		Save.targets.storage = saveStorage;
	};

	EditorWidgets.LocalFile = LocalFile;
})(EditorWidgets || {});