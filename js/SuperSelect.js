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
			}
		},
		init: function(options){
            var r = this,
                popup = this.find('.superselectPopup'),
                superSel = this.find('.superselect .btn'),
                select = this.find('select'),
                resizeEvt = function(){
                    var bodyRect = document.body.getBoundingClientRect(),
                        elemRect = superSel.getBoundingClientRect(),
                        offsetTop = (elemRect.top + 45) - bodyRect.top,
                        offsetLeft = elemRect.left - bodyRect.left;
                    popup.style.top = offsetTop + "px";
                    popup.style.left = offsetLeft + "px";
                };
            popup.parentNode.removeChild(popup);
            document.body.appendChild(popup);
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
					}else{
						sels.push(optval);
					}
				}else{
					select.value = optval;
					this.set('selection',(sels[0] === optval)?[]:[optval]);
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