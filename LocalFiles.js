var EditorWidgets
(function(EditorWidgets){
	var Save = EditorWidgets.Save,
		fileDialogTemplate = '<input type="file" data-template-key="filepicker" />',
		storageDialogTemplate = '<div data-template-key="filelist" style="padding:0 20px 20px 20px;min-width:150px;max-height: 150px;overflow: auto;"></div>';

	var saveFile = (navigator.userAgent.indexOf("Firefox")!==-1)?(function(fdata){
			fdata.forEach(function(fobj){
				window.open("data:"+fobj.mime+";charset=UTF-8,"+encodeURIComponent(fobj.data),'_blank');
			});
		}):(function(){
			var link = document.createElement('a'),
				evt = document.createEvent("HTMLEvents");
			link.target = "_blank";
			evt.initEvent("click",false,false);
			return function(fdata){
				fdata.forEach(function(fobj){
					link.download = fobj.name;
					link.href = "data:"+fobj.mime+";charset=UTF-8,"+encodeURIComponent(fobj.data);
					link.dispatchEvent(evt);
				});
			}
		}());
	saveFile.label = "Save to File";
	
	function saveStorage(fdata){
		fdata.forEach(function(fobj){ localStorage["file:"+fobj.name] = JSON.stringify(fobj); });
	}
	saveStorage.label = "Save to Browser Storage";
	
	function fileDialog(exp,cb){ //show file picker dialog
		EditorWidgets.Template.Dialog("Choose File",fileDialogTemplate,{
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
	fileDialog.label = "Read File";
	
	function storageDialog(exp,cb){ //show storage key picker dialog
		EditorWidgets.Template.Dialog("Choose File", storageDialogTemplate,{
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
	storageDialog.label = "Read Browser Storage";
	
	function LocalFile(loc,exp,cb){ (LocalFile.sources.hasOwnProperty(loc)?LocalFile.sources[loc]:fileDialog)(exp,cb); }
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