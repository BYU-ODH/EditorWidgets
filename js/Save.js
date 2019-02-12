function buildPart(fobj) {
    return 'Content-Disposition: form-data; name="'
        + (fobj.collection||'files')+'[]"; filename="'
        + fobj.name + '"\r\nContent-Type: '
        + fobj.mime + '\r\n\r\n'
        + fobj.data + '\r\n';
}

function buildPost(fdata){
    var i = 0, boundary, pboundary,
        parts = fdata.map(buildPart);

    do{ boundary = (++i + Date.now()).toString(36); }
    while(parts.some(function(part){ return part.indexOf(boundary) >= 0; }));
    pboundary = "--" + boundary;

    return {
        'content-type': "multipart/form-data; boundary=" + boundary,
        body:    pboundary + "\r\n"
                + parts.join(pboundary + "\r\n")
                + pboundary + "--\r\n"
    };
}

function savePost(fdata, target, success, error){
    var xhr = new XMLHttpRequest(),
        post = buildPost(fdata);

    if(typeof success !== 'function'){ success = function(){}; }
    if(typeof error !== 'function'){ error = function(){}; }
    xhr.onreadystatechange = function(){
        if(this.readyState == 4){
            ((this.status >= 200 && this.status < 400)?success:error)(this.responseText);
        }
    };
    xhr.open("POST",target,true);
    xhr.setRequestHeader("Content-type",post['content-type']);
    xhr.send(post.body);
}

function Save(fdata, target, success, error){
    (Save.targets.hasOwnProperty(target)?Save.targets[target]:savePost)(fdata, target, success, error);
}
Save.targets = {};
Save.targetIsURL = function(target){
    return !Save.targets.hasOwnProperty(target);
}

/**
 * saveFile and saveStorage were moved here from 'LocalFiles.js'
 * to prevent having to manage a save instance
 */
var saveFile = (function(){
    var link = document.createElement('a');
    link.target = "_blank";
    return function(fdata,target,success,error){
        try{
            fdata.forEach(function(fobj){
                var evt = document.createEvent("MouseEvents");
                evt.initMouseEvent("click",
                    false, false, //bubble, cancel
                    window, 1, //view, detail (click count)
                    0,0,0,0, //screen X, Y, client X, Y
                    false,false,false,false, //ctrl, alt, shift, meta
                    0, null //button, relatedTarget
                );
                link.download = fobj.name;
                link.href = "data:"+fobj.mime+";charset=UTF-8,"+encodeURIComponent(fobj.data);
                link.dispatchEvent(evt);
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

Save.targets.file = saveFile;
Save.targets.storage = saveStorage;

export default Save

