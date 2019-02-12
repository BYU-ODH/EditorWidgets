import Save from './Save.js'
import Template from './Templates.js'

var storageDialogTemplate = '<div data-template-key="filelist" style="padding:0 20px 20px 20px;min-width:150px;max-height: 150px;overflow: auto;"></div>';

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
    Template.Dialog("Choose File", storageDialogTemplate,{
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

export default LocalFile

