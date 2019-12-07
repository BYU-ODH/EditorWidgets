var props = {
    minLeft: -1/0, maxLeft: 1/0,
    minTop: -1/0, maxTop: 1/0
},
ae = null; //active element

function Dragable(element, handle, config){
    var p, min;
    if(!config){ config = {}; }
    this.minTop = this.minLeft = -1/0;
    this.maxTop = this.maxLeft = 1/0;
    for(p in props){
        this[p] = (config.hasOwnProperty(p)?config:props)[p];
    }
    this.element = element;
    if(config.x){
        element.style.left = Math.min(Math.max(config.x,this.minLeft),this.maxLeft)+'px';
    }else{
        min = Math.max(this.minLeft,0);
        element.style.left = (Math.random()*(Math.min(this.maxLeft,document.body.offsetWidth || window.clientWidth) - min)+min) + 'px';
    }
    if(config.y){
        element.style.top = Math.min(Math.max(config.y,this.minTop),this.maxTop)+'px';
    }else{
        min = Math.max(this.minTop,0);
        element.style.top = (Math.random()*(Math.min(this.maxTop,document.body.offsetHeight || window.clientHeight) - min)+min) + 'px';
    }
    
    handle.addEventListener('mousedown',mouseDown.bind(this), false);
}

function mouseDown(e){
    this.ex = this.element.offsetLeft;
    this.ey = this.element.offsetTop;
    this.mx = e.pageX || e.clientX + document.documentElement.scrollLeft;
    this.my = e.pageY || e.clientY + document.documentElement.scrollTop;
    ae = this;
    e.preventDefault(e);
};

document.addEventListener('mouseup', function(){ ae = null; }, false);
document.addEventListener('mousemove', function(e){
    if(!ae){ return; }
    var mx = e.pageX || e.clientX + document.documentElement.scrollLeft,
        my = e.pageY || e.clientY + document.documentElement.scrollTop;
    ae.element.style.left = Math.max(Math.min(ae.ex + mx - ae.mx, ae.maxLeft), ae.minLeft) + 'px';
    ae.element.style.top = Math.max(Math.min(ae.ey + my - ae.my, ae.maxTop), ae.minTop) + 'px';
    e.preventDefault();
}, false);

export default Dragable

