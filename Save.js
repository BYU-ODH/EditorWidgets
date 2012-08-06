(function(){
	if(typeof window.EditorWidgets !== 'object'){
		window.EditorWidgets = {};
	}
	
	function buildPart(fobj) {
		return 'Content-Disposition: form-data; name="'
			+ (fobj.collection||'files')+'[]"; filename="'
			+ fobj.name + '"\r\nContent-Type: '
			+ fobj.mime + '\r\n\r\n'
			+ fobj.data + '\r\n';
	}
	
	function saveserver(fdata, target, success, error){
		var i = 0, boundary,
			xhr = new XMLHttpRequest(),
			parts = fdata.map(buildPart);
		
		do{ boundary = (++i + Date.now()).toString(36); }
		while(parts.some(function(part){ return part.indexOf(boundary) >= 0; }));
		
		if(typeof success !== 'function'){ success = function(){}; }
		if(typeof error !== 'function'){ error = function(){}; }
		xhr.onreadystatechange = function(){
			if(this.readyState == 4){
				((this.status >= 200 && this.status < 400)?success:error)(this.responseText);
			}
		};
		
		xhr.open("POST",target,true);
		xhr.setRequestHeader("Content-type","multipart/form-data; boundary=" + boundary);
		boundary = "--"+boundary;
		xhr.send(
			boundary + "\r\n"
			+ parts.join(boundary + "\r\n")
			+ boundary + "--\r\n"
		);
	}
	
	function savelocal(fdata){
		var link = document.createElement('a');
		fdata.forEach(function(fobj){
			var evt = document.createEvent("HTMLEvents");
			evt.initEvent("click");
			link.download = fobj.name;
			link.href = "data:"+fobj.mime+";charset=UTF-8,"+encodeURIComponent(fobj.data);
			link.dispatchEvent(evt);
		});
	}

	EditorWidgets.Save = function(fdata, target, success, error){
		(target === 'file'?savelocal:saveserver)(fdata, target, success, error);
	};
})();