var EditorWidgets
(function(EditorWidgets){
	
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
			body:	pboundary + "\r\n"
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

	EditorWidgets.Save = Save;
})(EditorWidgets || (EditorWidgets = {}));