(function(){
	if(typeof window.EditorWidgets !== 'object'){
		window.EditorWidgets = {};
	}

	EditorWidgets.SuperSelect = Ractive.extend({
		template: '<div style="display:inline-block;position:relative;">\
			<select style="display:none;" name="{{id}}" id="{{id}}" multiple="{{multiple}}">\
				{{#options}}<option value="{{.value}}" selected="{{checkSelected(.value, selection)}}"></option>{{/options}}\
			</select>\
			<div class="superselect">\
				{{#(button === "left")}}<div>\
					<button class="btn" proxy-tap="open"><i class="{{icon}}"></i> {{text}}</button>\
				</div>{{/button}}\
				<span>\
				{{#options:i}}\
					{{#checkSelected(.value,selection)}}\
						<span class="badge badge-info pad-right-low">\
							{{.text}} {{#multiple}}<span style="color: white; cursor: pointer;" proxy-tap="select:{{i}}">×</span>{{/multiple}}\
						</span>\
					{{/checkSelected}}\
				{{/options}}\
				{{#showDefault}}\
						<span class="badge badge-info pad-right-low">\
							{{defaultValue.text}}\
						</span>\
				{{/showDefault}}\
				{{^selection.length}}<span>Nothing selected</span>{{/selection.length}}\
				</span>\
				{{^(button === "left")}}<div>\
					<button class="btn" proxy-tap="open"><i class="{{icon}}"></i> {{text}}</button>\
				</div>{{/button}}\
			</div>\
			<div class="superselectPopup {{(button === "left"?"left":"right")}}" style="display:{{open?"block":"none"}};" proxy-tap="clickpopup">\
				<div class="point"></div>\
				<div class="point"></div>\
				<div>\
					<input type="text" class="search-query" value="{{filterstr}}"/>\
				</div>\
				<div class="optionListing">\
					{{#options:i}}\
					{{#filter(filterstr,.text)}}\
					<div class="{{checkSelected(.value,selection)?"option selected":"option"}}" proxy-tap="select:{{i}}"><div class="check"></div>{{.text}}</div>\
					{{/filter}}\
					{{/options}}\
				</div>\
			</div>\
		</div>',
		data: {
			filterstr: "",
			filter: function(str,text){ return text.toLowerCase().indexOf(str.toLowerCase()) > -1; },
			checkSelected: function(optval,selval){
				return ~selval.indexOf(optval);
			},
			showDefault: false
		},
		init: function(options){
            var r = this,
                popup = this.find('.superselectPopup'),
                superSel = this.find('.superselect .btn'),
                select = this.find('select'),
				defaultExists = (this.data.defaultValue instanceof Object),
				defval = defaultExists ? this.data.defaultValue : null,
                modalId = this.data.modalId ? this.data.modalId : false,
                resizeEvt;

            // Allow the popup to pop out of whatever element it is in to reduce cliping
            popup.parentNode.removeChild(popup);
            if (modalId){
            // modals don't allow selection of input elements outside of modal
                document.getElementById(modalId).appendChild(popup);
                resizeEvt = function(){
                    var bodyRect = document.getElementById(modalId).getBoundingClientRect(),
                        elemRect = superSel.getBoundingClientRect(),
                        offsetTop = (elemRect.top + 45) - bodyRect.top,
                        offsetLeft = elemRect.left - bodyRect.left;
                    popup.style.top = offsetTop + "px";
                    popup.style.left = offsetLeft + "px";
                };
            } else {
                document.body.appendChild(popup);
                resizeEvt = function(){
                    var bodyRect = document.body.getBoundingClientRect(),
                        elemRect = superSel.getBoundingClientRect(),
                        offsetTop = (elemRect.top + 45) - bodyRect.top,
                        offsetLeft = elemRect.left - bodyRect.left;
                    popup.style.top = offsetTop + "px";
                    popup.style.left = offsetLeft + "px";
                };
            }
			// If the default value is already in the selection, move it to the front
			if (defaultExists) {
				var s = this.data.selection;
				if (~(s.indexOf(defval.value))) { s.splice(s, 1); }
				s.unshift(defval.value);
			}
			
			this.set('showDefault', defaultExists);
			this.set('open',false);
			this.on('clickpopup',function(e){ e.original.stopPropagation(); });
			this.on('open',function(e) {
				e.original.stopPropagation();
				e.original.preventDefault();
				if(this.data.open){
					this.set('open', false);
				}else{
					this.set('open', true);
                    resizeEvt();
				}
				return false;
			});
			this.on('select',function(e,which){
				var sels = this.data.selection,
					selopt = select.options[which],
					optval = this.data.options[which].value;
				if(this.data.multiple){
					if(selopt.selected){
						sels.splice(sels.indexOf(optval),1);
						if (defaultExists && sels.length === 0) {
							sels.push(defval.value);
							this.set('showDefault', true);
						}
					}else{
						sels.push(optval);
						if (defaultExists && sels[0] === defval.value) {
							sels.splice(0,1);
							this.set('showDefault', false);
						}
					}
				}else{
					select.value = optval;
					if (defaultExists) {
						this.set('selection',(sels[0] === optval)?[defval.value]:[optval]);
					} else {
						this.set('selection',(sels[0] === optval)?[]:[optval]);
					}
				}
                resizeEvt();
			});
            window.addEventListener("resize", function(){ if (r.data.open) resizeEvt(); }, false);
			window.addEventListener("click", function(){ r.set('open',false); }, false);
			document.addEventListener("keyup", function(e) {
				if (e.keyCode === 27) { r.set('open',false); }
            });
		}
	});
}());